const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 후 유저 등록 or 불러오기
router.post('/register', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: '카카오 정보 누락' });
  }

  let user = await User.findOne({ kakaoId });

  if (!user) {
    user = new User({ kakaoId, nickname });
    await user.save();
  }

  res.json({ success: true, user });
});

// 유저 정보 조회
router.get('/userdata', async (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId 없음' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, user: null });

  res.json({ success: true, user });
});

module.exports = router;
