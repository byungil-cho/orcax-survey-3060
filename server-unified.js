// server-unified.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3060;

// ✅ CORS 설정
app.use(cors({
  origin: ["https://byungil-cho.github.io"],
  credentials: true
}));
app.use(bodyParser.json());

// ✅ MongoDB 연결 (환경변수 MONGODB_URL 고정)
const MONGO_URI = process.env.MONGODB_URL;
if (!MONGO_URI) {
  console.error("❌ MONGODB_URL 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

/* ============================================================
   🥔 감자 농장 (기존 코드) 👉 절대 수정하지 않음
============================================================ */
const userSchema = new mongoose.Schema({
  kakaoId: String,
  seeds: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  potatoes: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
});
const User = mongoose.model("User", userSchema);

// 감자 농장 API (그대로 유지)
app.get("/api/farm/status", async (req, res) => {
  const { kakaoId } = req.query;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json(user);
});

/* ============================================================
   🌽 옥수수 농장 (신규 추가)
============================================================ */
const cornSchema = new mongoose.Schema({
  kakaoId: String,
  seeds: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  corns: { type: Number, default: 0 },
  popcorns: { type: Number, default: 0 },
  salt: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
});
const Corn = mongoose.model("Corn", cornSchema);

// 옥수수 농장 상태 조회
app.get("/api/corn/status", async (req, res) => {
  const { kakaoId } = req.query;
  const user = await Corn.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json(user);
});

/* ============================================================
   🆕 공용 초기화 API (감자 + 옥수수 동시에)
============================================================ */
app.get("/api/init-user", async (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (!kakaoId) return res.status(400).json({ error: "kakaoId required" });

  try {
    // 감자 농장 초기화
    let potatoUser = await User.findOne({ kakaoId });
    if (!potatoUser) {
      potatoUser = new User({ kakaoId });
      await potatoUser.save();
    }

    // 옥수수 농장 초기화
    let cornUser = await Corn.findOne({ kakaoId });
    if (!cornUser) {
      cornUser = new Corn({ kakaoId });
      await cornUser.save();
    }

    res.json({ potatoUser, cornUser });
  } catch (err) {
    console.error("init-user error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================================================
   🚀 서버 시작
============================================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
