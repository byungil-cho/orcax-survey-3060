const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 제품 저장 (nickname 기반 POST)
router.post('/:nickname', async (req, res) => {
  const { nickname } = req.params;
  const { products } = req.body;

  if (!nickname || !products) {
    return res.status(400).json({ success: false, message: '닉네임 또는 제품 정보가 없습니다.' });
  }

  try {
    let userProducts = await Product.findOne({ nickname });

    if (userProducts) {
      userProducts.products = products; // 기존 내용 덮어쓰기
      await userProducts.save();
    } else {
      userProducts = await Product.create({ nickname, products });
    }

    res.json({ success: true, message: '제품 정보가 저장되었습니다.', products });
  } catch (err) {
    console.error('제품 저장 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류로 저장 실패' });
  }
});

// 제품 조회 (nickname 기반 GET)
router.get('/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const userProducts = await Product.findOne({ nickname });
    if (!userProducts) {
      return res.status(404).json({ success: false, message: '제품 정보가 없습니다.' });
    }

    res.json({ success: true, products: userProducts.products });
  } catch (err) {
    console.error('제품 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류로 조회 실패' });
  }
});

module.exports = router;
