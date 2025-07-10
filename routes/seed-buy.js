const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SeedStockSchema = new mongoose.Schema({
  type: String,
  quantity: Number
});
const SeedStock = mongoose.model('SeedStock', SeedStockSchema);

router.post('/', async (req, res) => {
  const { kakaoId, seedType } = req.body;
  if (!kakaoId || !seedType) {
    return res.status(400).json({ success: false, message: '데이터 누락' });
  }

  try {
    const stock = await SeedStock.findOne({ type: seedType });
    if (!stock || stock.quantity <= 0) {
      return res.status(400).json({ success: false, message: '재고 없음' });
    }

    // 재고 감소
    stock.quantity -= 1;
    await stock.save();

    // 응답
    return res.json({ success: true, message: '구매 완료' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
