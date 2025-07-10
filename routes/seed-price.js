const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SeedPriceSchema = new mongoose.Schema({
  type: String, // "seedPotato" or "seedBarley"
  price: Number
});

const SeedPrice = mongoose.model('SeedPrice', SeedPriceSchema);

// 가격 조회 API
router.get('/', async (req, res) => {
  try {
    const prices = await SeedPrice.find({});
    const response = {};
    prices.forEach(seed => {
      response[seed.type] = seed.price;
    });
    res.json(response);
  } catch (err) {
    res.status(500).send('가격 조회 실패');
  }
});

module.exports = router;
