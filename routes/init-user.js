const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;

    if (!kakaoId || !nickname) {
      return res.status(400).json({ success: false, message: 'kakaoId 또는 nickname이 없습니다.' });
    }

    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        orcx: 10,
        water: 10,
        fertilizer: 10,
        seedPotato: 0,
        seedBarley: 0,
        potatoCount: 0,
        barleyCount: 0,
        plantedPotato: 0,
        harvestablePotato: 0,
        harvestCount: 0,
        inventory: [],
        lastLogin: new Date(),
        lastRecharge: new Date(),
      });
      await user.save();
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('init-user 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
