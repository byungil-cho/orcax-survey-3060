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
// routes/products.js
router.get('/:nickname', async (req, res) => {
  const nickname = req.params.nickname;

  try {
    const products = await Product.find({ nickname }); // ❗ Product 모델이 nickname 필드를 갖고 있어야 합니다
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '서버 에러', error: err.message });
  }
});

module.exports = router;
