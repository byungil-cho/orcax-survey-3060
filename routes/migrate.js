// routes/migrate.js 또는 api/migrate.js
const express = require('express');
const router = express.Router();
const SeedStock = require('../models/SeedStock');

router.get('/', async (req, res) => {
  try {
    await SeedStock.deleteMany({});
    await SeedStock.insertMany([
      { name: '씨감자', stock: 100, price: 2 },
      { name: '씨보리', stock: 100, price: 2 },
    ]);
    res.status(200).json({ success: true, message: 'Migration 완료' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
