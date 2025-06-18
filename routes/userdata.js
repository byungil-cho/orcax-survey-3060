const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ test.users 컬렉션 연결
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    nickname: String,
    orcx: Number,
    farmingCount: Number,
    water: Number,
    fertilizer: Number,
    potatoCount: Number,
    harvestCount: Number,
    inventory: Array,
    exchangeLogs: Array,
    lastRecharge: Number,
  }),
  "users", // ✅ 반드시 'users'로 고정 (test.users 연결)
);

// ✅ URL 인코딩된 닉네임 받기 및 디코딩
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname); // ⭐ 이게 핵심
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ 유저 데이터 불러오기 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
