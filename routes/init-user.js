// routes/init-user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { nickname, kakaoId } = req.body;
  if (!nickname || !kakaoId) {
    return res.status(400).json({ success: false, message: '필수 정보 누락' });
  }

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, water: 10, fertilizer: 10, orcx: 10 });
      await user.save();
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
