// server-unified.js (확장)
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:3060/farmdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// === 스키마 ===
const UserSchema = new mongoose.Schema({
  kakaoId: String,
  tokens: Number,
  water: Number,
  fertilizer: Number,
  level: Number,
  harvestCount: Number,
});

const CornSchema = new mongoose.Schema({
  kakaoId: String,
  seed: Number,
  salt: Number,
  sugar: Number,
  popcorn: Number,
  growth: Number, // 0~100 %
  background: String, // 계절별 배경
  stageImg: String,   // 씨앗/새싹/옥수수
});

const User = mongoose.model("User", UserSchema);
const Corn = mongoose.model("Corn", CornSchema);

// === API ===

// 자원 불러오기
app.get("/api/user/resources/:kakaoId", async (req, res) => {
  const user = await User.findOne({ kakaoId: req.params.kakaoId });
  res.json(user);
});

// 옥수수 상태 불러오기
app.get("/api/corn/status/:kakaoId", async (req, res) => {
  const corn = await Corn.findOne({ kakaoId: req.params.kakaoId });
  res.json(corn);
});

// 구매
app.post("/api/corn/buy", async (req, res) => {
  const { kakaoId, item, qty } = req.body;
  const user = await User.findOne({ kakaoId });
  const corn = await Corn.findOne({ kakaoId });

  const prices = { salt: 10, sugar: 20, seed: 100 };
  const price = prices[item] * qty;

  if (user.tokens < price) return res.status(400).json({ error: "토큰 부족" });

  user.tokens -= price;
  corn[item] += qty;

  await user.save();
  await corn.save();

  res.json({ success: true, user, corn });
});

// 수확
app.post("/api/corn/harvest", async (req, res) => {
  const { kakaoId } = req.body;
  const user = await User.findOne({ kakaoId });
  const corn = await Corn.findOne({ kakaoId });

  if (corn.growth < 100) return res.status(400).json({ error: "아직 성장 중" });

  corn.growth = 0;
  user.harvestCount += 1;
  if (user.harvestCount % 5 === 0) user.level += 1;

  await user.save();
  await corn.save();

  res.json({ success: true, user, corn });
});

app.listen(3060, () => console.log("서버 3060 포트에서 실행 중"));

