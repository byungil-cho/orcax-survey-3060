// routes/init-user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId) {
    return res.status(400).json({
      success: false,
      message: 'kakaoId is required'
    });
  }

  try {
    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다. 먼저 회원가입하세요.'
      });
    }

    // 닉네임 변경 감지 시 서버에서도 갱신
    if (nickname && user.nickname !== nickname) {
      user.nickname = nickname;
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ init-user 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
