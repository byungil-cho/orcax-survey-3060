// ✅ 수정된 login.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ error: 'kakaoId와 nickname이 필요합니다.' });
  }

  let user = await User.findOne({ kakaoId });

  if (!user) {
    user = new User({
      kakaoId,
      nickname,
      orcx: 10,
      potato: 0,
      inventory: [],
      water: 10,
      fertilizer: 10,
      seedPotato: 2,
      seedBarley: 2,
    });
    await user.save();
    console.log('🌱 신규 유저 생성 및 초기 자원 지급 완료');
  }

  res.json({ success: true, user });
});

module.exports = router;
