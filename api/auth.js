const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 요청 처리
router.post('/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: '카카오 ID와 닉네임은 필수입니다.' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      // 새 유저 생성
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
    } else {
      // 기존 유저 로그인 기록 업데이트
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
