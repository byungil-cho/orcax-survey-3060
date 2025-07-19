const express = require('express');
const router = express.Router();
const User = require('../models/users');

// 물/거름 사용 및 성장포인트 증가 라우트
router.patch('/use-resource', async (req, res) => {
  try {
    const { kakaoId, cropType, water, fertilizer } = req.body;
    if (!kakaoId || !cropType) {
      return res.status(400).json({ success: false, message: "필수 데이터 누락" });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 숫자 변환
    const waterVal = Number(water);
    const fertVal = Number(fertilizer);

    // 자원 차감(0 미만 방지)
    if (!isNaN(waterVal)) user.water = Math.max((user.water || 0) + waterVal, 0);
    if (!isNaN(fertVal)) user.fertilizer = Math.max((user.fertilizer || 0) + fertVal, 0);

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

// 감자/보리 수확 라우트
router.post('/harvest', async (req, res) => {
  try {
    const { kakaoId, cropType } = req.body;
    if (!kakaoId || !cropType) {
      return res.status(400).json({ success: false, message: "필수 데이터 누락" });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 성장포인트 체크
    if (!user.growth) user.growth = {};
    let growthField = cropType === "seedPotato" ? "potato" : "barley";
    let storageField = cropType === "seedPotato" ? "gamja" : "bori";
    const requiredGrowth = 5; // 수확에 필요한 성장포인트 (필요시 조정)

    if ((user.growth[growthField] || 0) < requiredGrowth) {
      return res.status(400).json({ success: false, message: "Not enough growth to harvest" });
    }

    // 수확 후 성장포인트 차감, 보관함 증가
    user.growth[growthField] -= requiredGrowth;
    if (!user.storage) user.storage = {};
    user.storage[storageField] = (user.storage[storageField] || 0) + 1;

    await user.save();

    res.json({
      success: true,
      reward: 1,
      storage: user.storage,
      growth: user.growth,
      message: "수확 성공"
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
