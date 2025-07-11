// routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const kakaoId = String(req.body.kakaoId);
    console.log("🔍 요청된 kakaoId:", kakaoId);

    const user = await User.findOne({ kakaoId });
    if (!user) {
      console.warn("❌ 해당 유저 없음");
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log("✅ 유저 찾음:", user);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("🔥 서버 오류:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

