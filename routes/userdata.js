const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 유저 스키마 정의 없이 불러오기 (strict: false)
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('TestUser', userSchema, 'test.users');

// GET: 닉네임 기반 정보 요청
router.get('/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  try {
    const user = await User.findOne({ nickname: nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      potatoCount: user.potatoCount ?? 0,
      water: user.water ?? 0,
      fertilizer: user.fertilizer ?? 0,
      token: user.orcx ?? 0 // 여기서 토큰 필드가 orcx로 되어 있음
    });
  } catch (err) {
    console.error("❌ 사용자 정보 불러오기 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
