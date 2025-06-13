const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.post('/buy-seed', async (req, res) => {
  try {
    const { nickname, amount } = req.body;

    if (!nickname || !amount) {
      return res.status(400).json({ success: false, message: '닉네임 또는 수량 누락' });
    }

    const user = await Farm.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    const totalCost = Number(amount) * 2;
    if (user.token < totalCost) {
      return res.json({ success: false, message: '토큰 부족' });
    }

    user.token -= totalCost;
    user.seedPotato = Number(user.seedPotato || 0) + Number(amount);
    await user.save();

    console.log(`✅ 씨감자 지급 완료: ${nickname}, 총: ${user.seedPotato}`);
    res.json({ success: true, message: '구매 완료', token: user.token, seedPotato: user.seedPotato });
  } catch (err) {
    console.error("💥 씨감자 구매 실패:", err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
