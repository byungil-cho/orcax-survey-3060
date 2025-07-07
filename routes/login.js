const express = require('express');
const router = express.Router();

// 임시 로그인 핸들러
router.post('/', (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ message: 'kakaoId가 필요합니다.' });
  res.status(200).json({ message: '로그인 성공', kakaoId });
});

module.exports = router;
