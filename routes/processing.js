// routes/processing.js

const express = require('express');
const router = express.Router();

const User = require('../models/User');
const UserInventory = require('../models/UserInventory');

// 가공품 생산
router.post('/make-product', async (req, res) => {
  try {
    const { kakaoId, productType, productName } = req.body;
    if (!kakaoId || !productType || !productName) {
      return res.status(400).json({ message: '필수 정보 누락' });
    }

    // 유저 정보 불러오기
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: '유저 없음' });

    // 가공 원료(감자/보리) 확인 및 소진 처리
    let available = false;
    if (productType === '감자' && user.storage.gamja > 0) {
      user.storage.gamja -= 1;
      available = true;
    } else if (productType === '보리' && user.storage.bori > 0) {
      user.storage.bori -= 1;
      available = true;
    }
    if (!available) return res.status(400).json({ message: '원료 부족' });

    // 유저 인벤토리에 가공품 추가 (없으면 생성)
    let inventory = await UserInventory.findOne({ kakaoId });
    if (!inventory) {
      inventory = new UserInventory({ kakaoId, products: {} });
    }
    inventory.products[productName] = (inventory.products[productName] || 0) + 1;

    // 저장
    await user.save();
    await inventory.save();

    res.json({ message: '가공 성공', inventory: inventory.products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러' });
  }
});

// 유저 가공품 인벤토리 불러오기
router.post('/get-inventory', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ message: '필수 정보 누락' });

    let inventory = await UserInventory.findOne({ kakaoId });
    if (!inventory) {
      return res.status(200).json({ products: {} });
    }
    res.json({ products: inventory.products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러' });
  }
});

module.exports = router;
