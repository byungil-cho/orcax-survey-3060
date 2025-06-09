const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 간단한 시세 (mock data)
const marketPrices = [
  { name: "감자칩", price: 3 },
  { name: "감자전", price: 4 },
  { name: "감자볶음", price: 5 }
];

// 시세 조회
router.get('/market', (req, res) => {
  res.json(marketPrices);
});

// 제품 판매
router.post('/userdata', async (req, res) => {
  const { nickname, inventory, token } = req.body;
  if (!nickname || !Array.isArray(inventory)) {
    return res.status(400).json({ success: false, message: "필수 데이터 누락" });
  }

  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    user.inventory = inventory;
    user.token = token;

    await user.save();
    res.json({ success: true, token: user.token, inventory: user.inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: "판매 저장 실패" });
  }
});

module.exports = router;
