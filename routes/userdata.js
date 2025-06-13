const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.get('/', async (req, res) => {
  try {
    const nickname = req.query.nickname;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ error: '유저 없음' });

    res.json({
      nickname: user.nickname,
      potatoCount: user.potatoCount,
      barleyCount: user.barleyCount,
      seedPotato: user.seedPotato,
      token: user.token,
      water: user.water,
      fertilizer: user.fertilizer
    });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
