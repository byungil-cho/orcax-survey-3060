const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🔐 로그인 (카카오ID 기반)
router.post('/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId) return res.status(400).json({ error: '카카오 ID 없음' });

  let user = await User.findOne({ kakaoId });

  if (!user) {
    user = new User({
      kakaoId,
      nickname,
      orcx: 10,
      water: 10,
      fertilizer: 10,
      seedPotato: 2,
      seedBarley: 2
    });
    await user.save();
    console.log("🌱 신규 유저 자원 지급 완료");
  } else {
    let updated = false;

    if (user.seedPotato === undefined) {
      user.seedPotato = 2;
      updated = true;
    }
    if (user.seedBarley === undefined) {
      user.seedBarley = 2;
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log("🌾 기존 유저 씨앗 보충 지급 완료");
    }
  }

  res.json(user);
});

// 👤 유저 정보 조회
router.get('/userdata', async (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: '유저 없음' });

  res.json({ users: [user] });
});

module.exports = router;
