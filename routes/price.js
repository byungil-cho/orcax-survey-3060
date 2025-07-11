// routes/price.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 가격 정보 스키마
const priceSchema = new mongoose.Schema({
  product: { type: String, required: true }, // 예: '감자칩', '보리국수'
  price: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// 모델 정의
const Price = mongoose.model('Price', priceSchema);

// 💰 가격 목록 가져오기
router.get("/", async (req, res) => {
  try {
    const prices = await Price.find({});
    res.json({ success: true, prices });
  } catch (err) {
    res.status(500).json({ success: false, message: "가격을 불러오는 중 오류 발생" });
  }
});

// 💾 가격 저장 또는 수정 (상품명 중복 시 덮어씀)
router.post("/", async (req, res) => {
  const { product, price } = req.body;
  try {
    const updated = await Price.findOneAndUpdate(
      { product },
      { price, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ success: true, price: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "가격 저장 실패" });
  }
});

module.exports = router;
