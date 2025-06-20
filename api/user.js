// user.js - 사용자 관련 API 처리

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 사용자 등록 또는 로그인 처리
router.post('/login', async (req, res) => {
  const { nickname } = req.body;
  try {
    let user = await User.findOne({ nickname });
    if (!user) {
      user = new User({
        nickname,
        tokens: 10,
        씨감자: 2,
        씨보리: 2,
        물: 10,
        거름: 10,
        createdAt: new Date()
      });
      await user.save();
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err });
  }
});

// 사용자 정보 조회
router.get('/:nickname', async (req, res) => {
  try {
    const user = await User.findOne({ nickname: req.params.nickname });
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err });
  }
});

module.exports = router;
