// routes/seed-buy.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SeedStock = require('../models/SeedStock');

router.post('/', async (req, res) => {
  try {
    const { kakaoId, seedType } = req.body;

    // 필수 항목 확인
    if (!kakaoId || !seedType) {
      return res.status(400).json({ success: false, message: '필수 항목 누락' });
    }

    // 사용자 조회
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    // 씨앗 타입 유효성 확인
    if (!['seedPotato', 'seedBarley'].includes(seedType)) {
      return res.status(400).json({ success: false, message: '잘못된 씨앗 타입' });
    }

    // 가격 확인 (기본값 2 ORCX)
    const seedStock = await SeedStock.findOne({ seedType });
    if (!seedStock || seedStock.amount <= 0) {
      return res.status(400).json({ success: false, message: '씨앗 재고 없음' });
    }

    const price = seedStock.price || 2;

    // 토큰 보유량 확인
    if (user.orcx < price) {
      return res.status(400).json({ success: false, message: '보유 토큰 부족' });
    }

    // 씨앗 보유 제한 (최대 2개)
    const currentCount = user.inventory[seedType] || 0;
    if (currentCount >= 2) {
      return res.status(400).json({ success: false, message: '씨앗 보유 제한 초과' });
    }

    // 구매 처리
    user.orcx -= price;
    user.inventory[seedType] = currentCount + 1;
    await user.save();

    // 씨앗 재고 감소
    seedStock.amount -= 1;
    await seedStock.save();

    console.log(`✅ 구매 완료: ${kakaoId}, ${seedType}`);
    res.json({
      success: true,
      message: '씨앗 구매 완료',
      inventory: user.inventory,
      orcx: user.orcx
    });

  } catch (err) {
    console.error('❌ 씨앗 구매 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
