// 📂 routes/userdata.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ MongoDB 스키마 정의
const userSchema = new mongoose.Schema({
  nickname: String,
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  orcx: { type: Number, default: 10 },
  token: { type: Number, default: 0 },
  potatoCount: { type: Number, default: 0 },
  seed_barley: { type: Number, default: 0 },
  farmingCount: { type: Number, default: 0 },
  harvestCount: { type: Number, default: 0 },
  inventory: { type: Array, default: [] },
  exchangeLogs: { type: Array, default: [] },
  lastRecharge: { type: String, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ✅ 유저 정보 조회 API
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, users: [user] });
  } catch (error) {
    res.status(500).json({ success: false, message: "서버 에러", error });
  }
});

module.exports = router;
