// 📁 routes/userdata.js (최종 완성본)
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

    // 🎯 필요한 정보만 추려서 보냄
    res.json({
      success: true,
      nickname: user.nickname,
      potatoSeed: user.potatoSeed || 0,
      barleySeed: user.barleySeed || 0,
      water: user.water || 0,
      fertilizer: user.fertilizer || 0,
      token: user.token || 0,
      inventory: user.inventory || []  // ✅ 반드시 포함
    });
  } catch (err) {
    console.error('🚨 유저 불러오기 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
