const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const jwt     = require('jsonwebtoken');

router.post('/', async (req, res) => {
  const { nickname, kakaoId } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, error: "kakaoId와 nickname이 필요합니다." });
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
      harvestCount: 0,
      inventory: [],
      lastRecharge: new Date()
    });
    await user.save();
  }

  const accessToken = jwt.sign({ kakaoId }, "SECRET_KEY", { expiresIn: "1h" });

  res.json({ success: true, accessToken });
});

module.exports = router;
