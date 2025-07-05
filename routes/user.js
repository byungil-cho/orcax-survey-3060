// 📁 파일: routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/me', async (req, res) => {
  const kakaoId = req.query.kakaoId;

  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId 누락' });

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: '유저 없음' });

    res.json({
      success: true,
      nickname: user.nickname,
      token: user.token,
    });
  } catch (error) {
    console.error('유저 정보 조회 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
