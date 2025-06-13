// ✅ Step 1: 백엔드에서 제품 목록 조회 API가 정상인지 확인하고 구현함

// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 제품 목록 불러오기
router.get('/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const products = await Product.find({ nickname });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 제품 저장
router.post('/', async (req, res) => {
  const { nickname, productName, productType, quantity } = req.body;
  try {
    let item = await Product.findOne({ nickname, productName, productType });
    if (item) {
      item.quantity += quantity;
    } else {
      item = new Product({ nickname, productName, productType, quantity });
    }
    await item.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '저장 실패' });
  }
});

module.exports = router;
