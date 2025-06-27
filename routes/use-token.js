const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/use-token
router.post('/', async (req, res) => {
  try {
    const { nickname, amount } = req.body;

    if (!nickname || !amount) {
      return res.status(400).json({ success: false, message: '필수 값 누락' });
    }

    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }

    if (user.token < amount) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }

    user.token -= amount;
    user.seedPotato += 1; // 씨감자 증가 필드는 User.js 기준임

    await user.save();

    return res.status(200).json({ success: true, token: user.token, seedPotato: user.seedPotato });
  } catch (error) {
    console.error('토큰 사용 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
