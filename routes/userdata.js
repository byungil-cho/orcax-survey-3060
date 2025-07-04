const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 사용자 정보 조회 (카카오 ID 기준)
router.get('/', async (req, res) => {
  const kakaoId = req.query.kakaoId;

  if (!kakaoId) {
    return res.status(400).json({ success: false, message: 'kakaoId is required' });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ userdata API 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
