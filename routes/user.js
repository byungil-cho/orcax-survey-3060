const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 닉네임 기준 유저 데이터 조회
router.get('/userdata', async (req, res) => {
  const nickname = req.query.nickname;
  if (!nickname) return res.status(400).json({ error: 'nickname 필요' });

  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: '유저 없음' });

    res.json({ users: [user] });
  } catch (error) {
    console.error('유저 조회 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
