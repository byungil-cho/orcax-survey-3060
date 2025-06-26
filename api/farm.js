const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 모델 경로 맞게 수정하세요

router.post("/grow", async (req, res) => {
  const { nickname, cropType } = req.body;
  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.json({ success: false, error: "사용자 없음" });

    if (cropType === "물") {
      if (user.water < 1) return res.json({ success: false, error: "물 부족" });
      user.water -= 1;
    } else if (cropType === "거름") {
      if (user.fertilizer < 1) return res.json({ success: false, error: "거름 부족" });
      user.fertilizer -= 1;
    }

    if (user.seedPotato < 1) return res.json({ success: false, error: "씨감자 없음" });
    user.growthPoint += 1;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post("/harvest", async (req, res) => {
  const { nickname, amount } = req.body;
  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.json({ success: false, error: "사용자 없음" });

    if (user.seedPotato < 1) return res.json({ success: false, error: "씨감자 없음" });

    user.seedPotato -= 1;
    user.potato = (user.potato || 0) + amount;
    await user.save();

    res.json({ success: true, harvested: amount });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
