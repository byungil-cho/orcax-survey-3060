// routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 최초 로그인 시 사용자 데이터 생성
router.post('/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;

    let existingUser = await User.findOne({ kakaoId });
    if (existingUser) {
      return res.status(200).json({ message: '이미 가입된 유저입니다.', user: existingUser });
    }

    const newUser = new User({
      kakaoId,
      nickname,
      orcx: 10,
      water: 10,
      fertilizer: 10,
      seedPotato: 0,
      seedBarley: 0,
      potatoCount: 0,
      barleyCount: 0,
      harvestCount: 0,
      inventory: [],
    });

    await newUser.save();
    res.status(201).json({ message: '신규 유저 생성 완료', user: newUser });

  } catch (err) {
    console.error('초기화 에러:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
