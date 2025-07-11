const express = require('express');
const router = express.Router();
const User = require('../models/User');  // 정확한 경로 주의

router.post('/userdata', async (req, res) => {
  const { kakaoId } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

module.exports = router;

