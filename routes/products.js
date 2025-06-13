// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 전체 제품 목록 가져오기
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '서버 에러', error: err.message });
  }
});

module.exports = router;
