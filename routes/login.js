// routes/login.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: '필수 항목 누락' });
  }
  res.json({ success: true, message: '로그인 성공', kakaoId });
});

module.exports = router;
