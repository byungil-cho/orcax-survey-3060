const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET: nickname 기준 사용자 정보 조회
router.get('/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname.trim(); // 공백 제거
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname ?? '',
      farmName: user.farmName ?? '',
      potatoCount: user.potatoCount ?? 0,
      barleyCount: user.barleyCount ?? 0,
      water: user.water ?? 0,
      fertilizer: user.fertilizer ?? 0,
      token: user.token ?? 0, // ✅ 토큰 필드 확실히 포함됨!
      growth: user.growth ?? 0
    });
  } catch (err) {
    console.error("조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
