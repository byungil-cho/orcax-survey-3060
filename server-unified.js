const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
app.use(bodyParser.json());

// ✅ MongoDB 연결
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;

client.connect().then(() => {
  db = client.db("farmDB");
  console.log("✅ MongoDB 연결 성공");
});

// -------------------------------------------------------------
// 1️⃣ 공통 API (카카오 로그인, 마이페이지, 출금 신청)
// -------------------------------------------------------------
app.post("/api/login", async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId) return res.json({ success: false, message: "kakaoId 필요" });

  let user = await db.collection("users").findOne({ kakaoId });
  if (!user) {
    user = { kakaoId, nickname, water: 10, fertilizer: 10, token: 10 };
    await db.collection("users").insertOne(user);
  }
  res.json({ success: true, user });
});

app.post("/api/withdraw", async (req, res) => {
  const { kakaoId, wallet } = req.body;
  if (!kakaoId || !wallet) return res.json({ success: false });

  await db.collection("withdraw_requests").insertOne({
    kakaoId,
    wallet,
    status: "pending",
    createdAt: new Date()
  });

  res.json({ success: true, message: "출금 신청 완료" });
});

// -------------------------------------------------------------
// 2️⃣ 감자/보리 농장 (users 컬렉션)
// -------------------------------------------------------------
app.get("/api/farm/status", async (req, res) => {
  const { kakaoId } = req.query;
  const user = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user });
});

app.post("/api/farm/water", async (req, res) => {
  const { kakaoId } = req.body;
  const user = await db.collection("users").findOne({ kakaoId });
  if (!user || user.water <= 0) return res.json({ success: false });

  await db.collection("users").updateOne({ kakaoId }, { $inc: { water: -1 } });
  res.json({ success: true });
});

// -------------------------------------------------------------
// 3️⃣ 옥수수 농장 (corn_data 컬렉션)
// -------------------------------------------------------------
app.get("/api/corn/status", async (req, res) => {
  const { kakaoId } = req.query;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData) {
    cornData = { 
      kakaoId, 
      corn: 0, 
      seeds: 0, 
      popcorn: 0, 
      salt: 0, 
      sugar: 0, 
      token: 0,
      loan: { active: false, unpaid: 0, startDate: null },
      bankrupt: false
    };
    await db.collection("corn_data").insertOne(cornData);
  }
  res.json({ success: true, resources: cornData });
});

// 🌱 씨앗 심기
app.post("/api/corn/plant", async (req, res) => {
  const { kakaoId, loan } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData || cornData.seeds <= 0) {
    return res.json({ success: false, message: "씨앗 없음" });
  }

  // 씨앗 감소 + 옥수수 생성
  await db.collection("corn_data").updateOne(
    { kakaoId },
    { $inc: { seeds: -1, corn: 1 } }
  );

  // 대출이면 빨간색, 연체이면 검은색, 아니면 노란색
  let color = "yellow";
  if (cornData.loan.active) {
    color = "red";
  }
  if (cornData.loan.unpaid > 0 && overdueDays(cornData.loan.startDate) > 0) {
    color = "black";
  }

  cornData = await db.collection("corn_data").findOne({ kakaoId });
  res.json({ success: true, resources: cornData, color });
});

// 🌽 수확
app.post("/api/corn/harvest", async (req, res) => {
  const { kakaoId, days } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData || cornData.corn <= 0) {
    return res.json({ success: false, message: "옥수수 없음" });
  }

  // 등급 산정 (수확일 기준)
  let grade = "F";
  if (days === 5) grade = "A";
  else if (days === 6) grade = "B";
  else if (days === 7) grade = "C";
  else if (days === 8) grade = "D";
  else if (days === 9) grade = "E";
  else if (days >= 10) grade = "F";

  await db.collection("corn_data").updateOne(
    { kakaoId },
    { $inc: { corn: -1 } }
  );

  res.json({ success: true, grade });
});

// 🍿 뻥튀기
app.post("/api/corn/popcorn", async (req, res) => {
  const { kakaoId } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData || cornData.corn <= 0) return res.json({ success: false });

  const reward = Math.random() > 0.5 ? 1000 : 0;
  let tokenGain = reward;

  // 대출이면 30% 삭감
  if (cornData.loan.active) tokenGain = Math.floor(tokenGain * 0.7);

  await db.collection("corn_data").updateOne(
    { kakaoId },
    { $inc: { corn: -1, popcorn: 1, token: tokenGain } }
  );

  cornData = await db.collection("corn_data").findOne({ kakaoId });
  res.json({ success: true, resources: cornData });
});

// 💰 대출 신청
app.post("/api/corn/loan", async (req, res) => {
  const { kakaoId, amount } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (cornData.loan.active) {
    return res.json({ success: false, message: "이미 대출이 존재합니다." });
  }

  await db.collection("corn_data").updateOne(
    { kakaoId },
    { 
      $set: { "loan.active": true, "loan.unpaid": amount, "loan.startDate": new Date() },
      $inc: { token: amount }
    }
  );

  res.json({ success: true, message: "대출 성공" });
});

// 📉 매일 이자 처리
app.post("/api/corn/interest", async (req, res) => {
  const { kakaoId } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData.loan.active) return res.json({ success: false });

  const interest = Math.floor(cornData.loan.unpaid * 0.05);
  if (cornData.token < interest) {
    // 파산 처리
    await db.collection("corn_data").updateOne(
      { kakaoId },
      { $set: { bankrupt: true } }
    );
    return res.json({ success: false, message: "파산되었습니다." });
  }

  await db.collection("corn_data").updateOne(
    { kakaoId },
    { $inc: { token: -interest, "loan.unpaid": interest } }
  );

  cornData = await db.collection("corn_data").findOne({ kakaoId });
  res.json({ success: true, resources: cornData });
});

// 🏦 파산 해제 신청
app.post("/api/corn/recover", async (req, res) => {
  const { kakaoId, payment } = req.body;
  let cornData = await db.collection("corn_data").findOne({ kakaoId });

  if (!cornData.bankrupt) return res.json({ success: false, message: "파산 상태가 아님" });

  if (payment >= cornData.loan.unpaid * 2) {
    await db.collection("corn_data").updateOne(
      { kakaoId },
      { $set: { bankrupt: false, "loan.active": false, "loan.unpaid": 0 } }
    );
    res.json({ success: true, message: "파산 해제 완료" });
  } else {
    res.json({ success: false, message: "충분한 상환 불가" });
  }
});

// -------------------------------------------------------------
// Helper 함수
// -------------------------------------------------------------
function overdueDays(startDate) {
  if (!startDate) return 0;
  const today = new Date();
  const diff = today - new Date(startDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// -------------------------------------------------------------
// 서버 실행
// -------------------------------------------------------------
app.listen(3060, () => console.log("✅ Server running on port 3060"));










