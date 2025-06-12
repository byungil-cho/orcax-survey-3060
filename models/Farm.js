const mongoose = require('mongoose');
const Farm = require('../models/Farm');

const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  inventory: [
    {
      type: { type: String },
      count: Number
    }
  ],
  seedPotato: Number,
  lastFreeTime: Date,
  freeFarmCount: Number
});
// routes/barley.js
const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.post('/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;
  if (!nickname || typeof amount !== 'number') {
    return res.status(400).json({ success: false, message: '닉네임 또는 수확량 누락' });
  }

  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '유저 정보 없음' });

    user.barley = (user.barley || 0) + amount;
    await user.save();
    res.json({ success: true, barley: user.barley });
  } catch (err) {
    console.error('보리 수확 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});
barley: Number,

module.exports = router;
// ✅ 이 줄이 반드시 있어야 오류 방지됨!
module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
