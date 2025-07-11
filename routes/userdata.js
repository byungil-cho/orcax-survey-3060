const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId is required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
