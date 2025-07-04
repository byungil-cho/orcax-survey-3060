// routes/init-user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 사용자의 초기 자산 지급 API
router.post('/', async (req, res) => {
  const { kakaoId } = req.body;

  if (!kakaoId) {
    return res.status(400).json({ success: false, message: 'kakaoId is required' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname: '신규 유저',
        orcx: 10,
        water: 10,
        fertilizer: 10,
        seedPotato: 0,
        seedBarley: 0,
        potatoCount: 0,
        barleyCount: 0,
        harvestCount: 0,
        inventory: [],
        lastLogin: new Date(),
        lastRecharge: new Date()
      });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ init-user 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
