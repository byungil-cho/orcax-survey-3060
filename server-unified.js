// server-unified.js (고정/안정화 버전)
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
app.use(bodyParser.json());

// ===== MongoDB 연결 설정 =====
// 환경변수 MONGODB_URL 우선, 없으면 로컬 사용 (불필요한 경고 출력 안 함)
const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DBNAME || "farmDB";
let client;
let db;

// 전역 안전망
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("SIGINT", async () => {
  try { await client?.close(); } catch {}
  process.exit(0);
});

// ===== Helper =====
function overdueDays(startDate) {
  if (!startDate) return 0;
  const today = new Date();
  const diff = today - new Date(startDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ===== 라우트: 공통 (카카오 로그인, 출금) =====
app.post("/api/login", async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;
    if (!kakaoId) return res.json({ success: false, message: "kakaoId 필요" });

    const users = db.collection("users");
    let user = await users.findOne({ kakaoId });
    if (!user) {
      user = { kakaoId, nickname, water: 10, fertilizer: 10, token: 10 };
      await users.insertOne(user);
    }
    res.json({ success: true, user });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ success: false });
  }
});

app.post("/api/withdraw", async (req, res) => {
  try {
    const { kakaoId, wallet } = req.body;
    if (!kakaoId || !wallet) return res.json({ success: false });

    await db.collection("withdraw_requests").insertOne({
      kakaoId,
      wallet,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "출금 신청 완료" });
  } catch (e) {
    console.error("withdraw error:", e);
    res.status(500).json({ success: false });
  }
});

// ===== 라우트: 감자/보리 (users 컬렉션) =====
app.get("/api/farm/status", async (req, res) => {
  try {
    const { kakaoId } = req.query;
    const user = await db.collection("users").findOne({ kakaoId });
    res.json({ success: true, user });
  } catch (e) {
    console.error("farm/status error:", e);
    res.status(500).json({ success: false });
  }
});

app.post("/api/farm/water", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const users = db.collection("users");
    const user = await users.findOne({ kakaoId });
    if (!user || user.water <= 0) return res.json({ success: false });

    await users.updateOne({ kakaoId }, { $inc: { water: -1 } });
    res.json({ success: true });
  } catch (e) {
    console.error("farm/water error:", e);
    res.status(500).json({ success: false });
  }
});

// ===== 라우트: 옥수수 (corn_data 컬렉션) =====
app.get("/api/corn/status", async (req, res) => {
  try {
    const { kakaoId } = req.query;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });

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
        bankrupt: false,
      };
      await col.insertOne(cornData);
    }
    res.json({ success: true, resources: cornData });
  } catch (e) {
    console.error("corn/status error:", e);
    res.status(500).json({ success: false });
  }
});

// 🌱 씨앗 심기
app.post("/api/corn/plant", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });

    if (!cornData || cornData.seeds <= 0) {
      return res.json({ success: false, message: "씨앗 없음" });
    }

    // 씨앗 감소 + 옥수수 생성
    await col.updateOne({ kakaoId }, { $inc: { seeds: -1, corn: 1 } });

    // 대출이면 빨강, 연체이면 검정, 아니면 노랑
    let color = "yellow";
    if (cornData.loan?.active) color = "red";
    if (cornData.loan?.unpaid > 0 && overdueDays(cornData.loan.startDate) > 0) {
      color = "black";
    }

    cornData = await col.findOne({ kakaoId });
    res.json({ success: true, resources: cornData, color });
  } catch (e) {
    console.error("corn/plant error:", e);
    res.status(500).json({ success: false });
  }
});

// 🌽 수확
app.post("/api/corn/harvest", async (req, res) => {
  try {
    const { kakaoId, days } = req.body;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });
    if (!cornData || cornData.corn <= 0) {
      return res.json({ success: false, message: "옥수수 없음" });
    }

    let grade = "F";
    if (days === 5) grade = "A";
    else if (days === 6) grade = "B";
    else if (days === 7) grade = "C";
    else if (days === 8) grade = "D";
    else if (days === 9) grade = "E";
    else if (days >= 10) grade = "F";

    await col.updateOne({ kakaoId }, { $inc: { corn: -1 } });
    res.json({ success: true, grade });
  } catch (e) {
    console.error("corn/harvest error:", e);
    res.status(500).json({ success: false });
  }
});

// 🍿 뻥튀기
app.post("/api/corn/popcorn", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });
    if (!cornData || cornData.corn <= 0) return res.json({ success: false });

    const reward = Math.random() > 0.5 ? 1000 : 0;
    let tokenGain = cornData.loan?.active ? Math.floor(reward * 0.7) : reward;

    await col.updateOne(
      { kakaoId },
      { $inc: { corn: -1, popcorn: 1, token: tokenGain } }
    );

    cornData = await col.findOne({ kakaoId });
    res.json({ success: true, resources: cornData });
  } catch (e) {
    console.error("corn/popcorn error:", e);
    res.status(500).json({ success: false });
  }
});

// 💰 대출 신청
app.post("/api/corn/loan", async (req, res) => {
  try {
    const { kakaoId, amount } = req.body;
    const col = db.collection("corn_data");
    const cornData = await col.findOne({ kakaoId });

    if (cornData?.loan?.active) {
      return res.json({ success: false, message: "이미 대출이 존재합니다." });
    }

    await col.updateOne(
      { kakaoId },
      {
        $set: {
          "loan.active": true,
          "loan.unpaid": amount,
          "loan.startDate": new Date(),
        },
        $inc: { token: amount },
      },
      { upsert: true }
    );

    res.json({ success: true, message: "대출 성공" });
  } catch (e) {
    console.error("corn/loan error:", e);
    res.status(500).json({ success: false });
  }
});

// 📉 매일 이자 처리
app.post("/api/corn/interest", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });
    if (!cornData?.loan?.active) return res.json({ success: false });

    const interest = Math.floor((cornData.loan.unpaid || 0) * 0.05);
    if ((cornData.token || 0) < interest) {
      await col.updateOne({ kakaoId }, { $set: { bankrupt: true } });
      return res.json({ success: false, message: "파산되었습니다." });
    }

    await col.updateOne(
      { kakaoId },
      { $inc: { token: -interest, "loan.unpaid": interest } }
    );

    cornData = await col.findOne({ kakaoId });
    res.json({ success: true, resources: cornData });
  } catch (e) {
    console.error("corn/interest error:", e);
    res.status(500).json({ success: false });
  }
});

// 🏦 파산 해제 신청
app.post("/api/corn/recover", async (req, res) => {
  try {
    const { kakaoId, payment } = req.body;
    const col = db.collection("corn_data");
    let cornData = await col.findOne({ kakaoId });
    if (!cornData?.bankrupt) {
      return res.json({ success: false, message: "파산 상태가 아님" });
    }

    if (payment >= (cornData.loan?.unpaid || 0) * 2) {
      await col.updateOne(
        { kakaoId },
        { $set: { bankrupt: false, "loan.active": false, "loan.unpaid": 0 } }
      );
      return res.json({ success: true, message: "파산 해제 완료" });
    }
    res.json({ success: false, message: "충분한 상환 불가" });
  } catch (e) {
    console.error("corn/recover error:", e);
    res.status(500).json({ success: false });
  }
});

// ===== 부팅 시퀀스: DB 연결 성공 후 서버 가동 =====
(async () => {
  try {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ MongoDB 연결 성공 → ${MONGO_URI}/${DB_NAME}`);

    const PORT = process.env.PORT || 3060;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ MongoDB 연결 실패:", err.message);
    process.exit(1);
  }
})();


