// routes/login.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId 필요' });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ error: '유저 없음' });
    }
    res.status(200).json({ message: '로그인 성공', nickname: user.nickname });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
