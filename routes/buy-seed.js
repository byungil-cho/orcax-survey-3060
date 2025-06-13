const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 모델 경로 반드시 확인

router.post('/', async (req, res) => {
  try {
    console.log("🛠 [buy-seed] 요청 도착:", req.body); // ✅ 요청 도착 로그

    const { nickname, amount } = req.body;
    if (!nickname || !amount) {
      console.log("❌ 닉네임 또는 수량 없음");
      return res.status(400).json({ success: false, message: '닉네임 또는 수량 없음' });
    }

    const user = await Farm.findOne({ nickname });
    if (!user) {
      console.log("❌ 사용자 없음:", nickname);
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    const totalCost = Number(amount) * 2;
    if (user.token < totalCost) {
      console.log("❌ 토큰 부족");
      return res.json({ success: false, message: '토큰 부족' });
    }

    user.token -= totalCost;
    user.seedPotato = Number(user.seedPotato || 0) + Number(amount);
    await user.save();

    console.log(`[✅ 씨감자 구매 완료] ${nickname}: 씨감자 ${user.seedPotato}, 토큰 ${user.token}`);
    res.json({ success: true, message: '씨감자 구매 완료' });
  } catch (err) {
    console.error("💥 [buy-seed] 서버 오류:", err); // ✅ 진짜 오류 로그
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
