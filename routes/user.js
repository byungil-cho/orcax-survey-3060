const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🔐 로그인 (카카오ID 기반)
router.post('/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId) return res.status(400).json({ error: '카카오 ID 없음' });

  let user = await User.findOne({ kakaoId });

  if (!user) {
    // 새 유저 생성
    user = new User({ kakaoId, nickname });
    await user.save();
  }

  res.json(user);
});

// 👤 유저 정보 조회
router.get('/userdata', async (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: '유저 없음' });

  res.json(user);
});

module.exports = router;
