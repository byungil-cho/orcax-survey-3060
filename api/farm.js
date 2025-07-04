// api/farm.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 농사 성장 처리 API
router.post('/grow', async (req, res) => {
  const { kakaoId, cropType, type } = req.body;

  if (!kakaoId || !cropType || !type) {
    return res.status(400).json({ success: false, message: "필수 정보 누락" });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다" });
    }

    // 자원 확인
    if (user.gamja <= 0 || user.sibori <= 0) {
      return res.status(400).json({ success: false, message: "물 또는 거름이 부족합니다" });
    }

    // 자원 차감
    user.gamja -= 1;
    user.sibori -= 1;

    // 작물에 따른 성장 포인트 처리
    if (cropType === "potato") {
      user.growthPotato = (user.growthPotato || 0) + 2;
    } else if (cropType === "barley") {
      user.growthBarley = (user.growthBarley || 0) + 3;
    } else {
      return res.status(400).json({ success: false, message: "알 수 없는 작물 종류" });
    }

    await user.save();

    return res.json({
      success: true,
      message: `${cropType}에 ${type} 사용으로 성장 완료`,
      user,
    });
  } catch (err) {
    console.error("❌ 성장 처리 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
