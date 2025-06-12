const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const ProductLog = require('../models/ProductLog');

router.post('/convert-barley', async (req, res) => {
  const { nickname, product, amount } = req.body;
  if (!nickname || !product || !amount) {
    return res.status(400).json({ success: false, message: '요청 데이터 누락' });
  }

  const user = await Farm.findOne({ nickname });
  if (!user || (user.barley || 0) < amount) {
    return res.status(400).json({ success: false, message: '보리 부족 또는 유저 없음' });
  }

  user.barley -= amount;
  await user.save();

  const savedProduct = await ProductLog.create({
    nickname,
    product,
    quantity: amount,
    createdAt: new Date()
  });

  res.json({ success: true, product: savedProduct.product });
});

module.exports = router;
