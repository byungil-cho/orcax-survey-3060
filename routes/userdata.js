// /api/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 사용자 정보 가져오기
router.get('/', async (req, res) => {
  try {
    const { nickname } = req.query;

    if (!nickname) {
      return res.status(400).json({ success: false, message: '닉네임이 필요합니다.' });
    }

    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      orcx: user.orcx,
      potatoCount: user.potatoCount,
      barleyCount: user.barleyCount,
      seedPotato: user.seedPotato,
      seedBarley: user.seedBarley,
      water: user.water,
      fertilizer: user.fertilizer,
      farmCount: user['농사 개수'], // 정확한 키 확인
      harvestCount: user.harvestCount,
      factoryLog: user.factoryLog,
      lastCharged: user.lastCharged,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
