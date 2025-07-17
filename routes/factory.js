const express = require('express');
const router = express.Router();
const User = require('../models/users');          // 유저(농장주)
const SeedStocks = require('../models/seedstock'); // 씨앗 창고(관리자)
const CropStorage = require('../models/cropstorage'); // 작물 창고(유저별, 옵션)

// 1. 자원 사용 (물/거름 사용 → 성장 포인트 증가)
router.patch('/use-resource', async (req, res) => {
  try {
    const { kakaoId, cropType, water, fertilizer } = req.body;
    if (!kakaoId || !cropType) return res.status(400).json({ success: false, message: "필수값 누락" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

    // 자원 소모(없으면 차감 실패)
    if (typeof water === "number") {
      if ((user.water ?? 0) < Math.abs(water)) return res.json({ success: false, message: "물 부족" });
      user.water += water; // water는 -1로 들어옴
    }
    if (typeof fertilizer === "number") {
      if ((user.fertilizer ?? 0) < Math.abs(fertilizer)) return res.json({ success: false, message: "거름 부족" });
      user.fertilizer += fertilizer; // fertilizer도 -1로 들어옴
    }

    // 성장 포인트 증가 (물 1 = +1, 거름 1 = +2)
    // 항상 growth 객체 안전하게!
    if (!user.growth || typeof user.growth !== 'object') {
      user.growth = { potato: 0, barley: 0 };
    }
    if (cropType === "seedPotato") {
      user.growth.potato = (user.growth.potato || 0) + (water ? 1 : 0) + (fertilizer ? 2 : 0);
    }
    if (cropType === "seedBarley") {
      user.growth.barley = (user.growth.barley || 0) + (water ? 1 : 0) + (fertilizer ? 2 : 0);
    }

    await user.save();
    res.json({ success: true, water: user.water, fertilizer: user.fertilizer, growth: user.growth });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. 성장포인트 조회 (감자·보리 모두)
router.post('/growth-status', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.json({ success: false, message: "kakaoId 필요" });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    res.json({ success: true, growth: user.growth || { potato: 0, barley: 0 } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 3. 수확하기 (포인트 5 이상, 랜덤 수확)
router.post('/harvest', async (req, res) => {
  try {
    const { kakaoId, cropType } = req.body;
    if (!kakaoId || !cropType) return res.status(400).json({ success: false, message: "필수값 누락" });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

    if (!user.growth || typeof user.growth !== 'object') {
      user.growth = { potato: 0, barley: 0 };
    }
    let reward = 0, cropKey = "", growthKey = "";

    if (cropType === "seedPotato") {
      if ((user.seedPotato ?? 0) < 1) return res.json({ success: false, message: "씨감자 없음" });
      if ((user.growth.potato ?? 0) < 5) return res.json({ success: false, message: "성장포인트 부족" });
      // 랜덤 수확
      const yieldOptions = [3, 5, 7];
      reward = yieldOptions[Math.floor(Math.random() * yieldOptions.length)];
      user.seedPotato -= 1;
      user.potato = (user.potato ?? 0) + reward;
      user.growth.potato = 0; // 수확 후 초기화
      cropKey = "potato";
      growthKey = "potato";
    } else if (cropType === "seedBarley") {
      if ((user.seedBarley ?? 0) < 1) return res.json({ success: false, message: "씨보리 없음" });
      if ((user.growth.barley ?? 0) < 5) return res.json({ success: false, message: "성장포인트 부족" });
      const yieldOptions = [3, 5, 7];
      reward = yieldOptions[Math.floor(Math.random() * yieldOptions.length)];
      user.seedBarley -= 1;
      user.barley = (user.barley ?? 0) + reward;
      user.growth.barley = 0;
      cropKey = "barley";
      growthKey = "barley";
    } else {
      return res.json({ success: false, message: "잘못된 작물 종류" });
    }

    await user.save();

    res.json({
      success: true,
      message: "수확 성공",
      reward,
      cropType,
      cropAmount: user[cropKey],
      growth: user.growth,
      seedPotato: user.seedPotato,
      seedBarley: user.seedBarley
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
