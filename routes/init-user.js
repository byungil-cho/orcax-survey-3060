// routes/init-user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        farmName: `${nickname}의 감자농장`,
        물: 10,
        거름: 10,
        씨앗감자: 2,
        씨앗보리: 2,
        감자: 5,
        보리: 3,
        orcx: 10
      });
      await user.save();
      console.log(`[✅ 사용자 생성됨]: ${kakaoId}`);
    } else {
      console.log(`[🔁 기존 사용자]: ${kakaoId}`);
    }

    res.json({ message: '유저 초기화 완료', success: true, user });
  } catch (err) {
    console.error('[❌ init-user 오류]:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
