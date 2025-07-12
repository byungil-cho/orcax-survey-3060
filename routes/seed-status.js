// routes/seed-status.js
const express = require('express');
const router = express.Router();
const SeedStock = require('../models/SeedStock'); // 모델 경로 주의

router.get('/', async (req, res) => {
  try {
    const potato = await SeedStock.findOne({ type: 'seedPotato' });
    const barley = await SeedStock.findOne({ type: 'seedBarley' });

    res.json({
      success: true,
      seedPotato: potato?.quantity || 0,
      seedBarley: barley?.quantity || 0,
    });
  } catch (error) {
    console.error('❌ 씨앗 수량 불러오기 실패:', error);
    res.status(500).json({ success: false, message: '씨앗 수량 불러오기 실패' });
  }
});

module.exports = router;
