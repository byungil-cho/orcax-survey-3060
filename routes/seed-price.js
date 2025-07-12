const express = require("express");
const router = express.Router();
const SeedPrice = require("../models/SeedPrice"); // 실제 모델명에 맞게 수정

router.get("/", async (req, res) => {
  try {
    const latest = await SeedPrice.findOne().sort({ _id: -1 }); // 최신 가격
    if (!latest) {
      return res.status(404).json({ success: false, message: "가격 없음" });
    }

    res.json({
      success: true,
      seed_potato: latest["감자"],
      seed_barley: latest["보리"]
    });
  } catch (err) {
    console.error("❌ seed-price 오류:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
