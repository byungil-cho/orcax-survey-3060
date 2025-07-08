// 📁 routes/login.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ error: 'kakaoId와 nickname이 필요합니다' });
  }

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname });
      await user.save();
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('/api/login 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
