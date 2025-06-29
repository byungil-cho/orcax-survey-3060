// api/withdraw.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 출금 요청 저장
router.post('/', async (req, res) => {
  const { nickname, email, name, phone, phantom, solana, polygon } = req.body;

  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: '사용자 없음' });

    // 최소 출금 조건 확인
    if (user.tokens < 50000) return res.status(400).json({ error: '출금 최소 토큰 미달' });

    // 출금 요청 처리 (DB 또는 로그에 저장 필요)
    const request = {
      nickname,
      email,
      name,
      phone,
      phantom,
      solana,
      polygon,
      tokens: user.tokens,
      requestedAt: new Date()
    };

    // 여기선 간단히 console에 저장
    console.log('출금 요청:', request);

    // 사용자 토큰 0으로 초기화
    user.tokens = 0;
    await user.save();

    res.json({ success: true, message: '출금 요청 접수됨', data: request });
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err });
  }
});

module.exports = router;
