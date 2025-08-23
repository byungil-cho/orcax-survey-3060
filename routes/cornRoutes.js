// routes/cornRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const CornData = require("../models/CornData");

// 요약 조회
router.get("/summary", async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) {
      return res.status(400).json({ success: false, message: "kakaoId 필요" });
    }

    const user = await User.findOne({ kakaoId });
    const cornDoc = await CornData.findOne({ kakaoId });

    if (!user || !cornDoc) {
      return res.json({
        inventory: { seed: 0, water: 0, fertilizer: 0 },
        wallet: { orcx: 0 },
        agri: { corn: 0 },
        food: { popcorn: 0 },
        additives: { salt: 0, sugar: 0 },
        status: "fallow",
        day: 0,
        growthPercent: 0,
      });
    }

    res.json({
      inventory: {
        seed: Number(cornDoc.seed ?? 0),
        water: Number(user.water ?? 0),
        fertilizer: Number(user.fertilizer ?? 0),
      },
      wallet: { orcx: Number(user.tokens ?? 0) },
      agri: { corn: Number(cornDoc.corn ?? 0) },
      food: { popcorn: Number(cornDoc.popcorn ?? 0) },
      additives: {
        salt: Number(cornDoc.additives?.salt ?? 0),
        sugar: Number(cornDoc.additives?.sugar ?? 0),
      },
      status: cornDoc.corn > 0 ? "growing" : "fallow",
      day: cornDoc.corn > 0 ? 1 : 0,
      growthPercent: cornDoc.corn > 0 ? 50 : 0,
    });
  } catch (e) {
    console.error("corn/summary error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
