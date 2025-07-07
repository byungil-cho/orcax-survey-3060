// routes/init-user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ error: 'kakaoId와 nickname이 필요합니다.' });
  }

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname });
      await user.save();
    }
    res.json({ message: '유저 초기화 완료', success: true });
  } catch (err) {
    console.error('init-user error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
