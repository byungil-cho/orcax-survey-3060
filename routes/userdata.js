// routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 사용자 모델

// POST /api/userdata
router.post('/', async (req, res) => {
  const { kakaoId } = req.body;

  console.log("🔍 kakaoId 받음:", kakaoId);

  try {
    const user = await User.findOne({ kakaoId });

    console.log("🔎 DB 결과:", user);

    if (user) {
      // ✅ 프론트가 기대하는 구조로 응답
      res.json({ success: true, users: [user] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('🚨 Server error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

