const express = require('express');
const router = express.Router();
const Seed = require('../models/seedBank');

router.get('/status', async (req, res) => {
  const seedPotato = await Seed.findOne({ type: 'seedPotato' });
  const seedBarley = await Seed.findOne({ type: 'seedBarley' });
  res.json({ seedPotato, seedBarley });
});

router.post('/purchase', async (req, res) => {
  const { type } = req.body;
  const seed = await Seed.findOne({ type });
  if (!seed || seed.quantity <= 0) {
    return res.status(400).json({ message: '재고 없음' });
  }
  seed.quantity -= 1;
  await seed.save();
  res.json({ success: true, message: `${type} 구매 완료` });
});

module.exports = router;
