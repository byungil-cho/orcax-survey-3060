
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

    if ((user.orcx || 0) < amount) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }

    user.orcx -= amount;
    user.seedPotato = (user.seedPotato || 0) + 1; // seedPotato가 없을 경우도 대비

    await user.save();

    return res.status(200).json({ success: true, orcx: user.orcx, seedPotato: user.seedPotato });
  } catch (error) {
    console.error('토큰 사용 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
