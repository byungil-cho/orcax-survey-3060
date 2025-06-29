// api/auth.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

const INITIAL_TOKEN = 10;

router.post('/login', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).json({ success:false, message:'닉네임 필요' });

  let user = await User.findOne({ nickname });
  if (!user) {
    user = await User.create({
      nickname,
      orcx:       INITIAL_TOKEN,
      seedPotato: 0,
      seedBarley: 0,
      water:      10,
      fertilizer: 10,
      // …그 외 초기값…
    });
  }
  // 세션 설정 등
  req.session.userId = user._id;
  res.json({ success:true, user });
});

module.exports = router;
