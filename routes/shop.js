// routes/shop.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    items: [
      { id: 1, name: '감자 씨앗', price: 5 },
      { id: 2, name: '물뿌리개', price: 10 },
      { id: 3, name: '고급 비료', price: 20 }
    ]
  });
});

module.exports = router;
