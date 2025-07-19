const express = require('express');
const router = express.Router();
const User = require('../models/users'); // 실제 경로/이름 맞게 확인!

// 물/거름 사용 및 성장포인트 증가 라우트
router.patch('/use-resource', async (req, res) => {
  try {
    const { kakaoId, cropType, water, fertilizer } = req.body;

    if (!kakaoId || !cropType) {
      return res.status(400).json({ success: false, message: "필수 데이터 누락" });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // PATCH body에서 숫자 타입 강제 변환!
    const waterVal = Number(water);
    const fertVal = Number(fertilizer);

    // 자원 차감
    if (!isNaN(waterVal)) user.water = (user.water || 0) + waterVal;
    if (!isNaN(fertVal)) user.fertilizer = (user.fertilizer || 0) + fertVal;

    // 성장포인트 증가
    if (!user.growth) user.growth = {};
    if (cropType === "seedPotato") {
      user.growth.potato = (user.growth.potato || 0) + 5;
    } else if (cropType === "seedBarley") {
      user.growth.barley = (user.growth.barley || 0) + 5;
    }

    await user.save();

    res.json({
      success: true,
      water: user.water,
      fertilizer: user.fertilizer,
      growth: user.growth,
      message: "성장포인트 및 자원 갱신 성공"
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
