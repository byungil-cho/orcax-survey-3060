// routes/market.js
const express = require('express');
const router = express.Router();

// 여기에 서버에서 처리할 로직만 넣어라
router.get('/items', (req, res) => {
  // 예시 데이터
  const items = [
    { id: 1, name: '당근씨앗', price: 10 },
    { id: 2, name: '상추씨앗', price: 15 },
  ];
  res.json(items);
});

module.exports = router;
