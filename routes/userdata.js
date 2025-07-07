const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) return res.status(400).json({ message: 'kakaoId가 필요합니다.' });

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
