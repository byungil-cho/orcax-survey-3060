// shop.js (routes/shop.js)
const express = require('express');
const router = express.Router();

// 이 예시는 샘플 상품 목록을 리턴함
router.get('/', (req, res) => {
  res.json({
    message: '상점 API 작동 중',
    items: [
      { id: 1, name: '감자 씨앗', price: 5 },
      { id: 2, name: '물뿌리개', price: 10 },
      { id: 3, name: '고급 비료', price: 20 }
    ]
  });
});

module.exports = router;