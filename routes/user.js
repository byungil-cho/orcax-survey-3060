// 파일: routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ◼️ 수정된: 카카오 ID는 세션에서 확인
router.get('/me', async (req, res) => {
  const kakaoId = req.session.kakaoId; // ◼️ 이것이 한 단지!

  if (!kakaoId) return res.status(401).json({ success: false, message: '로그인 안됨' });

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: '유저 없음' });

    res.json({
      success: true,
      nickname: user.nickname,
      token: user.token
    });
  } catch (error) {
    console.error('유저 조회 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
