// api/purchase.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

const PRICE = 2;  // 씨감자·씨보리 가격

router.post('/purchase', async (req, res) => {
  const { nickname } = req.query;
  const { item }     = req.body;  // 'potato' or 'barley'
  if (!nickname || !['potato','barley'].includes(item)) {
    return res.status(400).json({ success:false, message:'잘못된 요청' });
  }

  const user = await User.findOne({ nickname });
  if (!user) return res.status(404).json({ success:false });

  if (user.orcx < PRICE) {
    return res.status(400).json({ success:false, message:'토큰 부족' });
  }

  // 차감 및 증가
  user.orcx -= PRICE;
  if (item === 'potato')   user.seedPotato += 1;
  else /* barley */        user.seedBarley += 1;

  await user.save();
  res.json({ success:true, users:[user] });
});

module.exports = router;
