const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SeedStock = require('../models/SeedStock');

// POST /api/seed/buy
router.post('/buy', async (req, res) => {
  try {
    const { kakaoId, seedType } = req.body;

    // 필수 항목 체크
    if (!kakaoId || !seedType) {
      return res.status(400).json({ success: false, message: '필수 항목 누락' });
    }

    const seedKey = seedType === 'potato' ? 'seedPotato' : seedType === 'barley' ? 'seedBarley' : null;

    if (!seedKey) {
      return res.status(400).json({ success: false, message: '유효하지 않은 씨앗 종류' });
    }

    // 사용자 조회
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    // 씨앗 보유 수량 확인
    if (user.inventory[seedKey] >= 2) {
      return res.status(400).json({ success: false, message: '씨앗은 최대 2개까지만 보유 가능' });
    }

    // 씨앗 재고 확인
    const stock = await SeedStock.findOne();
    if (!stock || stock[seedKey] <= 0) {
      return res.status(400).json({ success: false, message: '씨앗 품절' });
    }

    // 씨앗 가격 계산
    const price = stock.prices[seedKey];
    if (user.token < price) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }

    // 사용자 정보 업데이트
    user.inventory[seedKey] += 1;
    user.token -= price;
    await user.save();

    // 씨앗 재고 차감
    stock[seedKey] -= 1;
    await stock.save();

    return res.json({
      success: true,
      message: '씨앗 구매 성공',
      seedType,
      newCount: user.inventory[seedKey],
      remainToken: user.token
    });

  } catch (error) {
    console.error('씨앗 구매 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
