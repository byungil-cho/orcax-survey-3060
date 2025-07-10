// routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId 쿼리 필요' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    // 유저 없으면 자동 생성
    if (!user) {
      user = new User({
        kakaoId,
        nickname: "신규 사용자",
        farmName: "신규 농장",
        water: 10,
        fertilizer: 10,
        token: 0,
        potato: 0,
        barley: 0,
        level: 1,
        totalFarmingCount: 0
      });
      await user.save();
      console.log(`[🆕 자동 생성된 유저]: ${kakaoId}`);
    }

    res.json({ user });
  } catch (err) {
    console.error('[❌ userdata 오류]:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
