// api/login.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

const userdataRouter = require('./userdata'); // 브리지(아래 2번 파일)
const User = require('./models/User');       // 주인님 기존 경로 유지

// 미들웨어 (라우터 한정)
router.use(express.json());

// ✅ 사용자 저장 API
router.post('/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: "닉네임 또는 카카오 ID 누락" });
  }
  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 로그인 API
router.post('/login', async (req, res) => {
  const { kakaoId } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (user) return res.json({ success: true, user });
    return res.status(404).json({ success: false, message: 'User not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 유저 조회 API (기존 구조 유지: /api/userdata/*)
router.use('/userdata', userdataRouter);

module.exports = router;
