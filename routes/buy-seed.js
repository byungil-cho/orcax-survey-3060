// 📄 routes/buy-seed.js
const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 경로 확인 필요

router.post('/', async (req, res) => {
  try {
    const { nickname, amount } = req.body;
    if (!nickname || !amount) {
      console.error("❗ 요청 데이터 누락:", req.body);
      return res.status(400).json({ success: false, message: '닉네임 또는 수량 없음' });
    }

    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '사용자 없음' });

    const totalCost = Number(amount) * 2;
    if (user.token < totalCost) return res.json({ success: false, message: '토큰 부족' });

    user.token -= totalCost;
    user.seedPotato = Number(user.seedPotato || 0) + Number(amount);
    await user.save();

    console.log(`[✅ 씨감자 구매] ${nickname}: 씨감자 ${user.seedPotato}, 토큰 ${user.token}`);
    res.json({ success: true, message: '씨감자 구매 완료' });
  } catch (err) {
    console.error("❌ 씨감자 구매 중 서버 오류:", err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router; // ✅ 이 한 줄이 없으면 모든 게 무효
