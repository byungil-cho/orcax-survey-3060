const express = require("express");
const router = express.Router();
const User = require("../models/user");
const CornData = require("../models/CornData");

router.get("/summary", async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) {
      return res
        .status(400)
        .json({ success: false, message: "kakaoId 필요" });
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
        // 호환성 alias
        seed: 0,
        seeds: 0,
        seedCorn: 0,
        seed_corn: 0,
        tokens: 0,
        orcx: 0,
        seedTotal: 0,
      });
    }

    // 실제 값
    const seedVal = Number(cornDoc.seed ?? 0);
    const waterVal = Number(user.water ?? 0);
    const fertVal = Number(user.fertilizer ?? 0);
    const orcxVal = Number(user.tokens ?? 0);
    const cornVal = Number(cornDoc.corn ?? 0);
    const popVal = Number(cornDoc.popcorn ?? 0);
    const saltVal = Number(cornDoc.additives?.salt ?? 0);
    const sugarVal = Number(cornDoc.additives?.sugar ?? 0);

    res.json({
      inventory: {
        seed: seedVal,
        water: waterVal,
        fertilizer: fertVal,
      },
      wallet: { orcx: orcxVal },
      agri: { corn: cornVal, seedTotal: seedVal, seedCorn: seedVal },
      food: { popcorn: popVal },
      additives: { salt: saltVal, sugar: sugarVal },

      // 👇 호환성을 위한 alias 값들
      seed: seedVal,
      seeds: seedVal,
      seedCorn: seedVal,
      seed_corn: seedVal,
      seedTotal: seedVal,
      tokens: orcxVal,
      orcx: orcxVal,
    });
  } catch (e) {
    console.error("corn/summary error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
