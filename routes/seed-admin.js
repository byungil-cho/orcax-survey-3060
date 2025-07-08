// 📁 routes/seed-admin.js
const express = require('express');
const router = express.Router();
const SeedInventory = require('../models/SeedInventory');

// ✅ 씨앗 가격 설정 API
router.post('/set-price', async (req, res) => {
  const { type, price } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '씨앗 타입 오류' });
  }

  try {
    const seed = await SeedInventory.findOne({ _id: 'singleton' });
    if (!seed) {
      return res.status(404).json({ message: '씨앗 데이터 없음' });
    }
    seed[type].price = price;
    await seed.save();
    res.status(200).json({ success: true, newPrice: seed[type].price });
  } catch (err) {
    console.error('/admin/set-price error:', err);
    res.status(500).json({ message: '가격 설정 실패' });
  }
});

// ✅ 씨앗 초기화 API
router.post('/init', async (req, res) => {
  const { seedPotato, seedBarley } = req.body;
  try {
    await SeedInventory.findOneAndUpdate(
      { _id: 'singleton' },
      { seedPotato, seedBarley },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('/admin/init error:', err);
    res.status(500).json({ message: '초기화 실패' });
  }
});

module.exports = router;
