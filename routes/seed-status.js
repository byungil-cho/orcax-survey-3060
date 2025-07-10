const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SeedStockSchema = new mongoose.Schema({
  type: String, // "seedPotato" or "seedBarley"
  quantity: Number
});

const SeedStock = mongoose.model('SeedStock', SeedStockSchema);

// 재고 조회 API
router.get('/', async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    const response = {};
    stocks.forEach(seed => {
      response[seed.type] = seed.quantity;
    });
    res.json(response);
  } catch (err) {
    res.status(500).send('재고 조회 실패');
  }
});

module.exports = router;
