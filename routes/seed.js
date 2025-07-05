// 씨감자·씨보리 중앙 창고 + 사용자 구매/사용 흐름 설계 코드

////////////////////////
// 서버 측 (Node.js + Express 예시)
////////////////////////

// 중앙 창고 상태 저장용 (임시 메모리, 실제로는 DB로 대체)
let seedBank = {
  seedPotato: 500,
  seedBarley: 500
};

// 구매 요청 처리
app.post('/api/buy-seed', (req, res) => {
  const { userId, type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 종류' });
  }

  if (seedBank[type] <= 0) {
    return res.status(400).json({ message: '재고 부족' });
  }

  // 토큰 차감 & 씨앗 지급 로직 생략 (별도 구현)
  seedBank[type] -= 1;

  return res.json({ success: true, remaining: seedBank[type] });
});

// 씨앗 사용 시 관리자 창고로 반환
app.post('/api/return-seed', (req, res) => {
  const { type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 타입' });
  }

  seedBank[type] += 1;
  return res.json({ success: true, total: seedBank[type] });
});

// 관리자 모드에서 재고 조회
app.get('/api/admin/seed-status', (req, res) => {
  res.json(seedBank);
});

////////////////////////
// 라우터 등록 (routes/seed.js)
////////////////////////

const express = require('express');
const router = express.Router();

let seedBank = {
  seedPotato: 500,
  seedBarley: 500
};

router.post('/buy', (req, res) => {
  const { userId, type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 종류' });
  }
  if (seedBank[type] <= 0) {
    return res.status(400).json({ message: '재고 부족' });
  }
  seedBank[type] -= 1;
  res.json({ success: true, remaining: seedBank[type] });
});

router.post('/return', (req, res) => {
  const { type } = req.body;
  if (!['seedPotato', 'seedBarley'].includes(type)) {
    return res.status(400).json({ message: '잘못된 씨앗 타입' });
  }
  seedBank[type] += 1;
  res.json({ success: true, total: seedBank[type] });
});

router.get('/status', (req, res) => {
  res.json(seedBank);
});

module.exports = router;

////////////////////////
// 서버 메인 파일(app.js 등)에 추가
////////////////////////

// const seedRoutes = require('./routes/seed');
// app.use('/api/seed', seedRoutes);
