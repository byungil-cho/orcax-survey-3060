// routes/seed-buy.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SeedStock = require('../models/SeedStock');

// 씨앗 구매 API
router.post('/buy', async (req, res) => {
  const { kakaoId, type } = req.body;

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 씨앗 가격은 고정값 또는 외부에서 가져올 수 있음
    const price = 2;

    if (user.token < price) {
      return res.status(400).json({ success: false, message: '토큰이 부족합니다.' });
    }

    // 관리자 씨앗 보관소 재고 확인
    const stock = await SeedStock.findOne({ type });
    if (!stock || stock.quantity <= 0) {
      return res.status(400).json({ success: false, message: '재고가 부족합니다.' });
    }

    // 유저 씨앗 2개 초과 보유 금지
    if (user.inventory[type] >= 2) {
      return res.status(400).json({ success: false, message: '씨앗은 최대 2개까지만 보유할 수 있습니다.' });
    }

    // 구매 처리
    user.token -= price;
    user.inventory[type] += 1;
    await user.save();

    // 관리자 재고 차감
    await SeedStock.findOneAndUpdate({ type }, { $inc: { quantity: -1 } });

    res.json({ success: true, message: `${type} 구매 완료`, token: user.token, inventory: user.inventory });
  } catch (error) {
    console.error('씨앗 구매 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
