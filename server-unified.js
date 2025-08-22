// server-unified.js
// 감자·보리(users 컬렉션) + 옥수수(corn_data 컬렉션) 통합 서버

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// ===== 모델 =====
const User = require("./models/users");              // 감자/보리
const Withdraw = require("./models/withdraw");       // 출금
const MarketProduct = require("./models/marketProduct"); 
const CornData = require("./models/cornData");       // 옥수수 전용

// ===== 라우트 =====
const factoryRoutes = require("./routes/factoryRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const userdataV2Routes = require("./routes/userdataV2Routes");
const seedRoutes = require("./routes/seedRoutes");
const seedBuyRoutes = require("./routes/seedBuyRoutes");
const initUserRoutes = require("./routes/initUserRoutes");
const loginRoutes = require("./routes/loginRoutes");
const processingRoutes = require("./routes/processingRoutes");
const marketdataRoutes = require("./routes/marketdataRoutes");
const marketRoutes = require("./routes/marketRoutes");
const seedPriceRoutes = require("./routes/seedPriceRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ==========================================================
   감자/보리 전용 API (users 컬렉션)
   ========================================================== */

// 출금 신청
app.post("/api/withdraw", async (req, res) => {
  try {
    const { kakaoId, amount, walletAddress } = req.body;
    if (!kakaoId || !amount || !walletAddress) {
      return res.status(400).json({ message: "필수 정보 누락" });
    }
    const withdraw = new Withdraw({ kakaoId, amount, walletAddress, status: "pending" });
    await withdraw.save();
    res.json({ message: "출금 신청 완료", withdraw });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 토큰 업데이트
app.post("/api/user/update-token", async (req, res) => {
  try {
    const { kakaoId, tokens } = req.body;
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.tokens = tokens;
    await user.save();
    res.json({ message: "토큰 업데이트 완료", tokens: user.tokens });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 전체 유저 데이터 조회
app.get("/api/userdata/all", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 유저 프로필 조회
app.get("/api/user/profile/:nickname", async (req, res) => {
  try {
    const { nickname } = req.params;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 유저 데이터 저장
app.post("/api/userdata", async (req, res) => {
  try {
    const { kakaoId, nickname, water, fertilizer, tokens, gamja, bori } = req.body;
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        water,
        fertilizer,
        tokens,
        storage: { gamja, bori },
      });
    } else {
      user.water = water;
      user.fertilizer = fertilizer;
      user.tokens = tokens;
      user.storage.gamja = gamja;
      user.storage.bori = bori;
    }
    await user.save();
    res.json({ message: "User data saved", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 로그인 (카카오 기반, 감자/보리 초기화)
app.post("/api/login", async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        water: 10,
        fertilizer: 10,
        tokens: 10,
        storage: { gamja: 0, bori: 0 },
      });
      await user.save();
    }
    res.json({ message: "로그인 성공", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ==========================================================
   옥수수 전용 API (corn_data 컬렉션)
   ========================================================== */

// 옥수수 농장 요약
app.get("/api/corn/:kakaoId", async (req, res) => {
  try {
    const { kakaoId } = req.params;
    const user = await User.findOne({ kakaoId }); // 공용 자원
    const corn = await CornData.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!corn) {
      const newCorn = new CornData({
        kakaoId,
        corn: 0,
        popcorn: 0,
        seed: 0,
        additives: { salt: 0, sugar: 0 },
        loan: { amount: 0, interest: 0 },
      });
      await newCorn.save();
      return res.json({ user, corn: newCorn });
    }
    res.json({ user, corn });
  } catch (err) {
    res.status(500).json({ message: "Corn summary error", error: err.message });
  }
});

// 옥수수 심기
app.post("/api/corn/plant", async (req, res) => {
  try {
    const { kakaoId, amount } = req.body;
    const corn = await CornData.findOne({ kakaoId });
    if (!corn) return res.status(404).json({ message: "CornData not found" });
    if (corn.seed < amount) return res.status(400).json({ message: "씨옥수수 부족" });
    corn.seed -= amount;
    corn.corn += amount;
    await corn.save();
    res.json({ message: "옥수수 심기 완료", corn });
  } catch (err) {
    res.status(500).json({ message: "Corn plant error", error: err.message });
  }
});
// 옥수수 씨앗 심기
app.post("/api/corn/plant", async (req, res) => {
  const { kakaoId, seedColor } = req.body;

  if (!kakaoId || !seedColor) {
    return res.status(400).json({ error: "필수 값 누락" });
  }

  try {
    // corn_data 업데이트
    await db.collection("corn_data").updateOne(
      { kakaoId },
      { $set: { seedColor, plantedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, seedColor });
  } catch (err) {
    console.error("씨앗 심기 오류:", err);
    res.status(500).json({ error: "DB 오류" });
  }
});

// 옥수수 수확
app.post("/api/corn/harvest", async (req, res) => {
  try {
    const { kakaoId, amount } = req.body;
    const corn = await CornData.findOne({ kakaoId });
    if (!corn) return res.status(404).json({ message: "CornData not found" });
    if (corn.corn < amount) return res.status(400).json({ message: "수확할 옥수수가 부족합니다" });
    corn.corn -= amount;
    corn.popcorn += amount;
    await corn.save();
    res.json({ message: "옥수수 수확 완료", corn });
  } catch (err) {
    res.status(500).json({ message: "Corn harvest error", error: err.message });
  }
});

// 뻥튀기 (옥수수 → 토큰 전환)
app.post("/api/corn/pop", async (req, res) => {
  try {
    const { kakaoId, amount } = req.body;
    const corn = await CornData.findOne({ kakaoId });
    const user = await User.findOne({ kakaoId });
    if (!corn || !user) return res.status(404).json({ message: "데이터 없음" });
    if (corn.popcorn < amount) return res.status(400).json({ message: "팝콘 부족" });
    corn.popcorn -= amount;
    user.tokens += amount; // 단순 1:1 변환 예시
    await corn.save();
    await user.save();
    res.json({ message: "뻥튀기 완료", corn, user });
  } catch (err) {
    res.status(500).json({ message: "Corn pop error", error: err.message });
  }
});

/* ==========================================================
   라우트 연결
   ========================================================== */
app.use("/api/factory", factoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/userdataV2", userdataV2Routes);
app.use("/api/seed", seedRoutes);
app.use("/api/seedbuy", seedBuyRoutes);
app.use("/api/inituser", initUserRoutes);
app.use("/api/loginRoutes", loginRoutes);
app.use("/api/processing", processingRoutes);
app.use("/api/marketdata", marketdataRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/seedPrice", seedPriceRoutes);

/* ==========================================================
   서버 실행
   ========================================================== */
const PORT = 3060;
mongoose
  .connect("mongodb://localhost:27017/farmgame")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Unified server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
