// 📁 파일: routes/market.js

const express = require('express');
const router = express.Router();

// ✅ 마켓 상태 확인용 더미 API
router.get('/', (req, res) => {
  res.json({ success: true, message: '마켓 서버 응답 OK' });
});

module.exports = router;
