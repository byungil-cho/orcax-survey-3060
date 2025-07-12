const express = require("express");
const router = express.Router();
const SeedPrice = require("../models/SeedPrice");

router.get("/", async (req, res) => {
  try {
    const latest = await SeedPrice.findOne().sort({ _id: -1 });

    if (!latest) {
      console.warn("⚠️ 씨앗 가격 정보 없음, 기본값으로 반환");
      return res.json({
        success: true,
        seed_potato: 1,
        seed_barley: 1
      });
    }

    res.json({
      success: true,
      seed_potato: latest.seed_potato,
      seed_barley: latest.seed_barley
    });
  } catch (err) {
    console.error("❌ /api/seed/price 오류", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
