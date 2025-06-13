// routes/harvest-barley.js
const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 보리 수확 처리
router.post('/', async (req, res) => {
  const { nickname, barleyAmount } = req.body;
  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '유저 없음' });

    // barleyCount 누적
    user.barleyCount = (user.barleyCount || 0) + barleyAmount;
    await user.save();

    res.json({ success: true, message: '보리 수확 성공', barleyCount: user.barleyCount });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
