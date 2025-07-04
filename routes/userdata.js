// routes/userdata.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET user data
router.get('/', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId required' });

    let user = await User.findOne({ kakaoId });

    if (!user) {
      // 새 유저 생성 시 kakaoId 포함하여 저장
      user = new User({
        kakaoId: kakaoId,
        nickname: "새 유저",
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 추가: POST 요청도 처리하도록 확장
router.post('/', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId required' });

    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId: kakaoId,
        nickname: "새 유저",
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
