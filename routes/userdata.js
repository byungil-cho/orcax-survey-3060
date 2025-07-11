const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/userdata', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) return res.status(400).json({ error: 'kakaoId required' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

module.exports = router;
