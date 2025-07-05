// 📁 파일: routes/seed.js

const express = require('express');
const router = express.Router();
const SeedInventory = require('../models/SeedInventory'); // 모델 경로 확인 필요

// ✅ 관리자 초기 재고/가격 설정 API
router.post('/admin/init', async (req, res) => {
  const { seedPotato, seedBarley } = req.body;

  if (!seedPotato || !seedBarley) {
    return res.status(400).json({ success: false, message: '초기값 누락' });
  }

  try {
    await SeedInventory.deleteMany({});
    await SeedInventory.create([
      {
        type: 'seedPotato',
        quantity: seedPotato.quantity,
        price: seedPotato.price,
      },
      {
        type: 'seedBarley',
        quantity: seedBarley.quantity,
        price: seedBarley.price,
      },
    ]);
    res.json({ success: true, message: '초기화 완료' });
  } catch (error) {
    console.error('초기화 오류:', error);
    res.status(500).json({ success: false, message: '초기화 실패' });
  }
});

// ✅ 씨앗 가격만 조회 API
router.get('/prices', async (req, res) => {
  try {
    const seeds = await SeedInventory.find();
    const prices = {};
    seeds.forEach(seed => {
      prices[seed.type] = seed.price;
    });
    res.json(prices);
  } catch (error) {
    console.error('가격 조회 오류:', error);
    res.status(500).json({ success: false, message: '가격 조회 실패' });
  }
});

// ✅ 씨앗 구매 API (토큰 확인 포함)
router.post('/purchase', async (req, res) => {
  const { type, userToken = 0 } = req.body;

  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ success: false, message: '잘못된 씨앗 타입' });
  }

  try {
    const seed = await SeedInventory.findOne({ type });
    if (!seed || seed.quantity <= 0) {
      return res.status(400).json({ success: false, message: '재고 부족' });
    }
    if (userToken < seed.price) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }
    seed.quantity -= 1;
    await seed.save();
    res.json({ success: true, message: `${type} 구매 완료`, price: seed.price });
  } catch (error) {
    console.error('구매 오류:', error);
    res.status(500).json({ success: false, message: '구매 실패' });
  }
});

// ✅ 씨앗 가격 수정 API (관리자용)
router.post('/admin/set-price', async (req, res) => {
  const { type, price } = req.body;

  if (!['seedPotato', 'seedBarley'].includes(type) || typeof price !== 'number') {
    return res.status(400).json({ success: false, message: '잘못된 요청' });
  }

  try {
    const seed = await SeedInventory.findOne({ type });
    if (!seed) return res.status(404).json({ success: false, message: '씨앗 없음' });

    seed.price = price;
    await seed.save();
    res.json({ success: true, newPrice: price });
  } catch (error) {
    console.error('가격 수정 오류:', error);
    res.status(500).json({ success: false, message: '가격 수정 실패' });
  }
});

module.exports = router;
