const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ MongoDB 스키마 정의
const userSchema = new mongoose.Schema({
  nickname: String,
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  orcx: { type: Number, default: 10 },
  potatoCount: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 2 },     // 🥔 씨감자
  seedBarley: { type: Number, default: 0 },     // 🌾 씨보리
  harvestCount: { type: Number, default: 0 },
  inventory: { type: Array, default: [] },
  exchangeLogs: { type: Array, default: [] },
  lastRecharge: { type: Number, default: Date.now }
});

const User = mongoose.model("test.users", userSchema, "test.users");

// ✅ 유저 등록 또는 확인 API
router.post("/user", async (req, res) => {
  const { nickname } = req.body;

  let user = await User.findOne({ nickname });
  if (!user) {
    user = new User({ nickname }); // 기본값은 스키마에서 자동 적용
    await user.save();
    return res.json({ success: true, message: "신규 유저 등록", user });
  }

  res.json({ success: true, message: "기존 유저", user });
});

// ✅ 유저 정보 조회 API
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ 사용자 정보 불러오기 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
