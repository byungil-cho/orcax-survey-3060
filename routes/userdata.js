const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 사용자 정보가 저장된 모델

// 유저 정보 불러오기
router.get('/userdata', async (req, res) => {
  const { nickname } = req.query;

  try {
    const user = await Farm.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      token: user.token,
      water: user.water,
      fertilizer: user.fertilizer,
      potatoCount: user.potatoCount || 0,
      barleyCount: user.barleyCount || 0,
      seedPotato: user.seedPotato || 0 // ✅ 씨감자 필드 반드시 포함!
    });

  } catch (err) {
    console.error("❌ 유저 데이터 조회 실패:", err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
