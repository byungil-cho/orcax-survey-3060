const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Farm = require('../models/Farm');

// 보리 수확 후 저장
router.post('/save-barley', async (req, res) => {
  const { nickname, barleyCount } = req.body;

  if (!nickname || barleyCount === undefined) {
    return res.status(400).json({ success: false, message: '필수 데이터 누락' });
  }

  try {
    const product = await Product.findOne({ nickname });

    if (product) {
      product.barley = (product.barley || 0) + barleyCount;
      await product.save();
    } else {
      await Product.create({ nickname, barley: barleyCount });
    }

    res.json({ success: true, message: '보리 저장 완료' });
  } catch (err) {
    console.error('보리 저장 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
