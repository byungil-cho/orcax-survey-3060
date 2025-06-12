const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const ProductLog = require('../models/ProductLog');

// 수확 처리
router.post('/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;
  try {
    const farm = await Farm.findOne({ nickname });
    if (!farm) return res.status(404).json({ success: false, message: '농장 없음' });

    farm.barleyCount += amount;
    await farm.save();

    await ProductLog.create({
      nickname,
      productName: '보리',
      quantity: amount,
      timestamp: new Date()
    });

    res.json({ success: true, message: `${amount}말 수확 완료`, current: farm.barleyCount });
  } catch (err) {
    res.status(500).json({ success: false, message: '수확 중 오류 발생', error: err.message });
  }
});

// 보유 제품 조회
router.get('/barley-products/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const farm = await Farm.findOne({ nickname });
    if (!farm) return res.status(404).json({ success: false, message: '농장 없음' });

    res.json({ success: true, barleyCount: farm.barleyCount });
  } catch (err) {
    res.status(500).json({ success: false, message: '데이터 불러오기 실패', error: err.message });
  }
});

module.exports = router;
