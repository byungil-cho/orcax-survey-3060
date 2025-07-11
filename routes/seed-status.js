const express = require('express');
const router = express.Router();
const SeedStock = require('../models/SeedStock');

// 씨앗 재고 조회 API
router.get('/', async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    const result = {};

    stocks.forEach(stock => {
      result[stock.type] = stock.quantity;
    });

    res.json(result);
  } catch (err) {
    console.error("씨앗 재고 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
