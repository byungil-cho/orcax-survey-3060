const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId 쿼리 누락' });
    }

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('userdata 오류:', error);
    return res.status(500).json({ success: false, message: '서버 내부 오류' });
  }
});

module.exports = router;
