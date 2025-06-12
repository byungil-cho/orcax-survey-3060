const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const Product = require('../models/Product');

// 보리 → 제품 가공 API
router.post('/convert-barley', async (req, res) => {
  const { nickname, amount, product } = req.body;

  if (!nickname || !amount || !product) {
    return res.status(400).json({ success: false, message: '필수 항목 누락' });
  }

  try {
    const user = await Farm.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    if (user.barleyCount < amount) {
      return res.status(400).json({ success: false, message: '보리 부족' });
    }

    // 보리 차감
    user.barleyCount -= amount;
    await user.save();

    // 제품 저장
    await Product.create({
      nickname,
      product,
      amount,
      timestamp: new Date()
    });

    return res.json({ success: true, product });
  } catch (err) {
    console.error('보리 가공 오류:', err);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
