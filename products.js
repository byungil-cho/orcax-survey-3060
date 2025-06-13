const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ✅ 제품 저장 (실제 DB에 등록)
router.post('/', async (req, res) => {
  try {
    const { nickname, name, price, category } = req.body;

    if (!nickname || !name || !price) {
      return res.status(400).json({ message: '필수 항목 누락' });
    }

    const newProduct = await Product.create({
      nickname,
      name,
      price,
      category,
      createdAt: new Date()
    });

    res.status(201).json({ message: '제품 등록 완료', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
