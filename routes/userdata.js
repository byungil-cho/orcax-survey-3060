// routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId 쿼리 필요' });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ error: '유저 없음' });
    }
    res.json({ user });
  } catch (err) {
    console.error('userdata error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
