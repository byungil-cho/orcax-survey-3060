// routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 유저 스키마

// 사용자 정보 불러오기
router.post('/userdata', async (req, res) => {
  const { kakaoId } = req.body;

  try {
    const user = await User.findOne({ kakaoId });

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('🚨 Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

