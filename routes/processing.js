// routes/processing.js
const express = require('express');
const router = express.Router();
const User = require('../models/users'); // 소문자 user 경로!!

// 유저 가공제품 인벤토리 조회
router.post('/get-inventory', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ error: 'No kakaoId' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // products 필드(가공제품 목록) 반환
  res.json({
    products: user.products || {},
    storage: user.storage || {},
    water: user.water || 0,
    fertilizer: user.fertilizer || 0,
    orcx: user.orcx || 0,
    seedPotato: user.seedPotato || 0,
    seedBarley: user.seedBarley || 0,
    nickname: user.nickname,
    farmName: user.farmName || ''
  });
});

// 가공제품 생산 (12종 제한)
router.post('/make-product', async (req, res) => {
  const { kakaoId, rawType, productName } = req.body;
  if (!kakaoId || !rawType || !productName)
    return res.status(400).json({ error: '필수값 누락' });

  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 원료(감자/보리) 수량 체크
  if (rawType === '감자') {
    if ((user.storage?.gamja || 0) < 1) {
      return res.status(400).json({ error: '감자가 부족합니다.' });
    }
  } else if (rawType === '보리') {
    if ((user.storage?.bori || 0) < 1) {
      return res.status(400).json({ error: '보리가 부족합니다.' });
    }
  } else {
    return res.status(400).json({ error: '잘못된 원료 타입' });
  }

  // 제품 12종 제한 (products 오브젝트 key가 12개 이상이면 생산불가)
  // 0개인 제품명은 자동 삭제
  if (!user.products) user.products = {};
  Object.keys(user.products).forEach(key => {
    if (user.products[key] <= 0) delete user.products[key];
  });
  const productKeys = Object.keys(user.products);
  if (!user.products[productName] && productKeys.length >= 12) {
    return res.status(400).json({ error: '최대 12종류까지 생산가능. 기존 제품 모두 소진 후 새로운 제품 생산 가능' });
  }

  // 원료 1개 차감
  if (rawType === '감자') user.storage.gamja -= 1;
  if (rawType === '보리') user.storage.bori -= 1;

  // products 필드에 생산 제품 추가/수량 증가
  user.products[productName] = (user.products[productName] || 0) + 1;

  await user.save();

  res.json({
    result: 'ok',
    products: user.products,
    storage: user.storage
  });
});

module.exports = router;
