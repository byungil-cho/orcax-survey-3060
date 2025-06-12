const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const BarleyProduct = require('../models/BarleyProduct');

// ✅ 보리 가공 (제품 만들기)
router.post('/convert-barley', async (req, res) => {
  const { nickname, product, quantity } = req.body;
  if (!nickname || !product || !quantity) {
    return res.json({ success: false, message: '입력값 부족' });
  }

  try {
    // 자동 유저 등록
    let user = await Farm.findOne({ nickname });
    if (!user) {
      user = await Farm.create({
        nickname,
        barley: 0,
        water: 10,
        fertilizer: 10,
        token: 5,
        potatoCount: 0
      });
    }

    if (user.barley < quantity) {
      return res.json({ success: false, message: '보리 수량 부족' });
    }

    user.barley -= quantity;
    await user.save();

    const existing = await BarleyProduct.findOne({ nickname, product });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
    } else {
      await BarleyProduct.create({ nickname, product, quantity });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('보리 가공 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 보리 제품 불러오기 + 자동 유저 등록
router.get('/barley-products/:nickname', async (req, res) => {
  const nickname = req.params.nickname;

  // 자동 등록
  let user = await Farm.findOne({ nickname });
  if (!user) {
    user = await Farm.create({
      nickname,
      barley: 0,
      water: 10,
      fertilizer: 10,
      token: 5,
      potatoCount: 0
    });
  }

  const products = await BarleyProduct.find({ nickname });
  res.json({ products });
});

// ✅ 사용자 기본 정보 조회 + 자동 등록
router.get('/userdata/:nickname', async (req, res) => {
  const nickname = req.params.nickname;

  let user = await Farm.findOne({ nickname });
  if (!user) {
    user = await Farm.create({
      nickname,
      barley: 0,
      water: 10,
      fertilizer: 10,
      token: 5,
      potatoCount: 0
    });
  }

  res.json({ user });
});

module.exports = router;
