// routes/seed-return.js
const express = require('express');
const router = express.Router();

const SeedInventory = require('../models/SeedInventory');
const User = require('../models/User');

router.post('/return', async (req, res) => {
  const { kakaoId, type, quantity } = req.body;
  const seedType = type === 'seedPotato' ? 'seedPotato' : 'seedBarley';

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: '유저 없음' });

    const seedEntry = await SeedInventory.findOne({ type: seedType });
    if (!seedEntry) return res.status(404).json({ message: '씨앗 항목 없음' });

    seedEntry.quantity += quantity;
    await seedEntry.save();

    res.json({ message: `${seedType} ${quantity}개 반환 완료` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
