const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 개별 유저 정보 조회 (nickname 기준)
router.get('/userdata/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname.replace(/\s+/g, ''); // 🔧 공백 제거
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
      potatoCount: user.potatoCount ?? 0
    });
  } catch (error) {
    console.error('[유저 정보 조회 오류]', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 전체 유저 목록 조회 (관리자용)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (error) {
    console.error('[유저 목록 조회 오류]', error);
    res.status(500).json({ success: false, message: '목록 조회 실패' });
  }
});

module.exports = router;
