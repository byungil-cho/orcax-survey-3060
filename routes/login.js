// api/login.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId는 필수입니다.' });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ error: '사용자 없음' });
    }

    res.status(200).json({ message: '로그인 성공', user });
  } catch (err) {
    console.error('/api/login error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
