// routes/cornRoutes.js
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
        seed: Number(cornDoc.seed ?? 0),        // ✅ 씨앗
        water: Number(user.water ?? 0),         // ✅ 물
        fertilizer: Number(user.fertilizer ?? 0) // ✅ 거름
      },
      wallet: { orcx: Number(user.tokens ?? 0) }, // ✅ 토큰
      agri: { corn: Number(cornDoc.corn ?? 0) },  // ✅ 옥수수
      food: { popcorn: Number(cornDoc.popcorn ?? 0) }, // ✅ 팝콘
      additives: {
        salt: Number(cornDoc.additives?.salt ?? 0),  // ✅ 소금
        sugar: Number(cornDoc.additives?.sugar ?? 0) // ✅ 설탕
      },
      status: cornDoc.corn > 0 ? "growing" : "fallow",
      day: cornDoc.corn > 0 ? 1 : 0,
      growthPercent: cornDoc.corn > 0 ? 50 : 0
    });
  } catch (e) {
    console.error("corn/summary error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});
