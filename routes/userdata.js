const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ 정확한 test.users 콜렉션 모델
const userSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  orcx: Number,
  potatoCount: Number,
  harvestCount: Number,
  inventory: Array,
  exchangeLogs: Array,
  lastRecharge: Number
});

const User = mongoose.model("test.users", userSchema, "test.users");

// ✅ 닉네임 기반으로 유저 데이터 조회
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname); // 인코딩된 한글 닉네임 처리
    const user = await User.findOne({ nickname: nickname });

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
