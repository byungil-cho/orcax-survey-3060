// backend/api/cornRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const CornData = require("../models/cornData");

// 요약 조회: 감자·보리(users) + 옥수수(corn_data)
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

    // 유저나 옥수수 문서 없으면 기본값 반환
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

    // ✅ 새 구조 반영
    const seedVal   = Number(cornDoc.agri?.seeds ?? 0);
    const cornVal   = Array.isArray(cornDoc.agri?.corn) ? cornDoc.agri.corn.length : Number(cornDoc.agri?.corn ?? 0);
    const popVal    = Number(cornDoc.agri?.popcorn ?? 0);
    const saltVal   = Number(cornDoc.agri?.additives?.salt ?? 0);
    const sugarVal  = Number(cornDoc.agri?.additives?.sugar ?? 0);

    const waterVal  = Number(user.inventory?.water ?? 0);
    const fertVal   = Number(user.inventory?.fertilizer ?? 0);
    const orcxVal   = Number(user.wallet?.tokens ?? 0);

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
