const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 불필요한 모듈 제거: login.js
// const login = require('./routes/login'); ❌ 오류 발생 부분 제거

router.post('/auth', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        orcx: 10,
        water: 10,
        fertilizer: 10,
        seedPotato: 0,
        potatoCount: 0,
        plantedPotato: 0,
        harvestablePotato: 0,
        harvestCount: 0,
        seedBarley: 0,
        barleyCount: 0,
        inventory: [],
        lastLogin: new Date(),
        lastRecharge: new Date()
      });
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
