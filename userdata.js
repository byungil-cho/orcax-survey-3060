const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 전체 유저 목록 조회
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (error) {
    console.error('유저 목록 불러오기 오류:', error);
    res.json({ success: false, message: '유저 불러오기 실패' });
  }
});

// 개별 유저 정보 조회 (닉네임 기준)
router.get('/userdata/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const user = await User.findOne({ nickname });
    if (!user) {
      return res.json({ success: false, message: '사용자 없음' });
    }
    res.json({
      success: true,
      nickname: user.nickname,
      water: user.water,
      fertilizer: user.fertilizer,
      token: user.token,
      potatoCount: user.potatoCount || 0
    });
  } catch (error) {
    console.error('유저 조회 오류:', error);
    res.json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
