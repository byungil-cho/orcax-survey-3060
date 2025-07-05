// 씨감자·씨보리 중앙 창고 + 사용자 구매/사용 흐름 설계 코드

////////////////////////
// 서버 측 (Node.js + Express 예시)
////////////////////////

let seedBank = {
  seedPotato: { quantity: 500, price: 2 },
  seedBarley: { quantity: 500, price: 2 }
};

app.post('/api/buy-seed', (req, res) => {
  const { userId, type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 종류' });
  }
  if (seedBank[type].quantity <= 0) {
    return res.status(400).json({ message: '재고 부족' });
  }

  // 토큰 차감 & 씨앗 지급 로직 생략 (별도 구현)
  seedBank[type].quantity -= 1;
  res.json({ success: true, remaining: seedBank[type].quantity, price: seedBank[type].price });
});

app.post('/api/return-seed', (req, res) => {
  const { type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 타입' });
  }
  seedBank[type].quantity += 1;
  res.json({ success: true, total: seedBank[type].quantity });
});

app.get('/api/admin/seed-status', (req, res) => {
  res.json(seedBank);
});

// 관리자 가격 수정 API
app.post('/api/admin/set-price', (req, res) => {
  const { type, price } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type) || typeof price !== 'number') {
    return res.status(400).json({ message: '잘못된 요청' });
  }
  seedBank[type].price = price;
  res.json({ success: true, newPrice: price });
});

////////////////////////
// 라우터 등록 (routes/seed.js)
////////////////////////

const express = require('express');
const router = express.Router();

let seedBank = {
  seedPotato: { quantity: 500, price: 2 },
  seedBarley: { quantity: 500, price: 2 }
};

router.post('/buy', (req, res) => {
  const { userId, type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 종류' });
  }
  if (seedBank[type].quantity <= 0) {
    return res.status(400).json({ message: '재고 부족' });
  }
  seedBank[type].quantity -= 1;
  res.json({ success: true, remaining: seedBank[type].quantity, price: seedBank[type].price });
});

router.post('/return', (req, res) => {
  const { type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 타입' });
  }
  seedBank[type].quantity += 1;
  res.json({ success: true, total: seedBank[type].quantity });
});

router.get('/status', (req, res) => {
  res.json(seedBank);
});

router.post('/admin/set-price', (req, res) => {
  const { type, price } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type) || typeof price !== 'number') {
    return res.status(400).json({ message: '잘못된 요청' });
  }
  seedBank[type].price = price;
  res.json({ success: true, newPrice: price });
});

module.exports = router;

////////////////////////
// 서버 메인 파일(app.js 등)에 추가
////////////////////////

// const seedRoutes = require('./routes/seed');
// app.use('/api/seed', seedRoutes);
