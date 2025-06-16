const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 💧 물 주기
router.post('/farm/water', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.water < 1) return res.json({ success: false, message: "물 부족" });
  user.water -= 1;
  user.growPoint = (user.growPoint || 0) + 1;
  await user.save();
  res.json({ success: true });
});

// 🧪 거름 주기
router.post('/farm/fertilize', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.fertilizer < 1) return res.json({ success: false, message: "거름 부족" });
  user.fertilizer -= 1;
  user.growPoint = (user.growPoint || 0) + 2;
  await user.save();
  res.json({ success: true });
});

// 🥔 씨감자 심기
router.post('/farm/plant', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.seedPotato < 1) return res.json({ success: false, message: "씨감자 없음" });
  user.seedPotato -= 1;
  user.growPoint = 0;
  await user.save();
  res.json({ success: true });
});

// 🎉 수확하기
router.post('/farm/harvest', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.growPoint < 3) return res.json({ success: false, message: "성장 포인트 부족" });
  user.potatoCount += 1;
  user.growPoint = 0;
  await user.save();
  res.json({ success: true });
});

module.exports = router;
