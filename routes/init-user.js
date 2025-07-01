// routes/init-user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/init-user
router.post('/', async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;

    if (!kakaoId || !nickname) {
      return res.status(400).json({ error: '카카오ID와 닉네임이 필요합니다.' });
    }

    const existingUser = await User.findOne({ kakaoId });
    if (!existingUser) {
      const newUser = new User({
        kakaoId,
        nickname,
        water: 10,
        fertilizer: 10,
        orcx: 10,
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
      await newUser.save();
      return res.status(201).json({ success: true, message: '신규 유저 생성 완료' });
    } else {
      return res.status(200).json({ success: true, message: '이미 존재하는 유저' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

module.exports = router;
