const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 예시 POST 처리
router.post('/', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ error: 'No Kakao ID' });

  const user = await User.findOne({ kakaoId });
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;


