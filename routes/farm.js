const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 💧 물 주기
router.post('/water', async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ success: false, message: '유저 없음' });

    if (user.water < 1) return res.json({ success: false, message: '물 부족' });

    user.water -= 1;
    user.growPoint = (user.growPoint || 0) + 1;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 🧪 거름 주기
router.post('/fertilize', async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ success: false, message: '유저 없음' });

    if (user.fertilizer < 1) return res.json({ success: false, message: '거름 부족' });

    user.fertilizer -= 1;
    user.growPoint = (user.growPoint || 0) + 2;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 🥔 씨감자 심기 (수정됨)
router.post('/plant', async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ success: false, message: '유저 없음' });

    if (user.seedPotato < 1) return res.json({ success: false, message: '씨감자 부족' });

    user.seedPotato -= 1;
    user.growPoint = 0; // 초기화
    await user.save();

    res.json({ success: true, message: '씨감자 심기 완료' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 🎉 수확하기
router.post('/harvest', async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ success: false, message: '유저 없음' });

    if ((user.growPoint || 0) < 10) return res.json({ success: false, message: '성장 포인트 부족' });

    user.growPoint = 0;
    user.potatoCount = (user.potatoCount || 0) + 5;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
