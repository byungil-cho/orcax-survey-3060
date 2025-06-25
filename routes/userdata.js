
// 📁 routes/userdata.js (통합 완전체)
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 유저 데이터 불러오기 (/api/userdata?nickname=xxx)
router.get('/', async (req, res) => {
  const { nickname } = req.query;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });
  }

  try {
    const user = await User.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }

    // ✅ 통합 구조에 맞춰 응답 구성
    res.json({
      success: true,
      nickname: user.nickname,
      자원: user.자원 || { 물: 0, 거름: 0 },
      토큰: user.토큰 || { 오크: 0 },
      씨앗: user.씨앗 || [],
      목록: user.목록 || [],
      감자_개수: user.감자_개수 || 0,
      보리_개수: user.보리_개수 || 0
    });
  } catch (err) {
    console.error('🚨 유저 불러오기 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
