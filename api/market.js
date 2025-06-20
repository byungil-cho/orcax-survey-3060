// api/market.js
const express = require('express');
const router = express.Router();
require('dotenv').config();

let marketBoard = [
  { product: '감자칩', price: 20 },
  { product: '감자튀김', price: 30 },
  { product: '보리검빵', price: 40 },
  { product: '보리국수', price: 50 },
];

// 전광판 제품 목록 조회
router.get('/', (req, res) => {
  res.json(marketBoard);
});

// 관리자용 가격 변경 API (관리자 인증 필요)
router.post('/update', (req, res) => {
  const { product, price, adminKey } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: '관리자 인증 실패' });
  }

  const item = marketBoard.find(p => p.product === product);

  if (item) item.price = price;
  else marketBoard.push({ product, price });

  res.json({ success: true, marketBoard });
});

module.exports = router;
