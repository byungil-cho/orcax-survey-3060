const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const products = await Product.find({ nickname });
    if (!products || products.length === 0) {
      return res.status(404).json({ message: '해당 유저의 제품이 없습니다.' });
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nickname, productName, productType, quantity } = req.body;
  if (!nickname || !productName || !productType || !quantity) {
    return res.status(400).json({ message: '모든 항목을 입력하세요.' });
  }

  try {
    const newProduct = new Product({ nickname, type: productName, category: productType, count: quantity });
    await newProduct.save();
    res.status(201).json({ message: '제품이 저장되었습니다.', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: '저장 중 오류 발생', error: err.message });
  }
});

module.exports = router;