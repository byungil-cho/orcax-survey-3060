const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 몽고디비 모델 있다고 가정

router.post('/api/use-token', async (req, res) => {
  const { nickname, amount, item } = req.body;
  if (!nickname || !amount || !item) {
    return res.status(400).json({ success: false, message: '필수 값 누락' });
  }

  try {
    const user = await User.findOne({ nickname });
    if (!user || user.orcx < amount) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }

    user.orcx -= amount;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: '서버 에러' });
  }
});

module.exports = router;
