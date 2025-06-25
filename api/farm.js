// api/farm.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 감자 수확 API
router.post("/harvest", async (req, res) => {
  try {
    const { nickname, amount } = req.body;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (user.growthPoint < 5) {
      return res.status(400).json({ success: false, error: "성장 포인트 부족" });
    }

    if (user.seedPotato < 1) {
      return res.status(400).json({ success: false, error: "씨감자 부족" });
    }

    user.seedPotato -= 1;
    user.growthPoint = 0;
    user.potatoCount = (user.potatoCount || 0) + amount;
    user.harvestCount = (user.harvestCount || 0) + amount;
    user.farmingCount = (user.farmingCount || 0) + 1;
    await user.save();

    res.json({ success: true, harvested: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// 성장 포인트 증가 API (물/거름 주기)
router.post("/grow", async (req, res) => {
  try {
    const { nickname, cropType } = req.body;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (user.water < 1 || user.fertilizer < 1) {
      return res.status(400).json({ success: false, error: "물 또는 거름 부족" });
    }

    user.water -= 1;
    user.fertilizer -= 1;
    user.growthPoint = (user.growthPoint || 0) + 1;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
