// routes/seed-price.js
const express = require('express');
const router = express.Router();
const SeedPrice = require('../models/SeedPrice');

router.get('/', async (req, res) => {
  try {
    const priceData = await SeedPrice.findOne();
    if (!priceData) {
      return res.json({
        success: true,
        seedPotatoPrice: 0,
        seedBarleyPrice: 0,
      });
    }

    res.json({
      success: true,
      seedPotatoPrice: priceData.potato || 0,
      seedBarleyPrice: priceData.barley || 0,
    });
  } catch (error) {
    console.error('❌ 씨앗 가격 불러오기 실패:', error);
    res.status(500).json({ success: false, message: '씨앗 가격 불러오기 실패' });
  }
});

module.exports = router;
