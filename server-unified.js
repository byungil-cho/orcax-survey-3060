const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB 최신 드라이버 방식 (옵션 제거)
mongoose.connect("mongodb://127.0.0.1:27017/farmgame")
  .then(() => console.log("✅ [MongoDB] connected to farmgame"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- 스키마 & 모델 정의 ---
const userSchema = new mongoose.Schema({
  kakaoId: String,
  water: Number,
  fertilizer: Number,
  token: Number,
});

const cornSchema = new mongoose.Schema({
  kakaoId: String,
  seeds: Number,
  corn: Number,
  salt: Number,
  sugar: Number,
  popcorn: Number,
  growthStage: Number,   // 성장 단계 (0=씨앗, 1=새싹, 2=중간, 3=완성)
  growthPercent: Number, // 수확까지 진행 퍼센트
  level: Number,         // 캐릭터 레벨
  lastUpdate: Date
});

const User = mongoose.model("User", userSchema);
const Corn = mongoose.model("Corn", cornSchema);

// --- API 라우트 ---
// 유저 자원 불러오기
app.get("/api/user/resources/:kakaoId", async (req, res) => {
  const user = await User.findOne({ kakaoId: req.params.kakaoId });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// 옥수수 농장 상태 불러오기
app.get("/api/corn/status/:kakaoId", async (req, res) => {
  const corn = await Corn.findOne({ kakaoId: req.params.kakaoId });
  if (!corn) return res.status(404).json({ error: "Corn farm not found" });
  res.json(corn);
});
// 사용자 데이터 불러오기 API
app.get("/api/userData", async (req, res) => {
  try {
    // 로그인된 사용자 id는 세션/토큰에서 가져온다고 가정
    // 지금은 테스트용으로 고정 userId
    const userId = req.query.userId || "testUser";

    const user = await db.collection("users").findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // corn_data도 같이 묶어서 보냄
    const cornData = await db.collection("corn_data").findOne({ userId });

    res.json({
      nickname: user.nickname || "농장주",
      level: user.level || 1,
      resources: {
        water: user.water || 0,
        fertilizer: user.fertilizer || 0,
        token: user.token || 0,
        cornSeed: cornData?.cornSeed || 0,
        salt: cornData?.salt || 0,
        sugar: cornData?.sugar || 0,
        popcorn: cornData?.popcorn || 0
      }
    });
  } catch (err) {
    console.error("Error fetching userData", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 구매 API
app.post("/api/corn/buy", async (req, res) => {
  const { kakaoId, item } = req.body;
  const user = await User.findOne({ kakaoId });
  const corn = await Corn.findOne({ kakaoId });

  if (!user || !corn) return res.status(404).json({ error: "Not found" });

  let cost = 0;
  if (item === "salt") cost = 10;
  if (item === "sugar") cost = 20;
  if (item === "seed") cost = 100;

  if (user.token < cost) return res.status(400).json({ error: "Not enough tokens" });

  // 차감
  user.token -= cost;
  if (item === "salt") corn.salt += 1;
  if (item === "sugar") corn.sugar += 1;
  if (item === "seed") corn.seeds += 1;

  await user.save();
  await corn.save();

  res.json({ success: true, user, corn });
});

// 수확 API
app.post("/api/corn/harvest", async (req, res) => {
  const { kakaoId } = req.body;
  const corn = await Corn.findOne({ kakaoId });
  if (!corn) return res.status(404).json({ error: "Corn farm not found" });

  if (corn.growthStage < 3) return res.status(400).json({ error: "Not ready for harvest" });

  corn.corn += 1;
  corn.level += 1; // 레벨업
  corn.growthStage = 0;
  corn.growthPercent = 0;
  corn.lastUpdate = new Date();

  await corn.save();

  res.json({ success: true, corn });
});

// 서버 실행
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 [Server] listening on :${PORT}`);
});



