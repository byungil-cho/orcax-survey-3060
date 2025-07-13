const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SeedPrice = mongoose.model("seedprices", new mongoose.Schema({}, { strict: false }));

router.get("/", async (req, res) => {
  try {
    const latest = await SeedPrice.findOne({}).sort({ _id: -1 }); // 최신 가격 1건
    if (!latest) {
      return res.json({ success: false, message: "가격 정보 없음" });
    }

    res.json({
      success: true,
      seedPotatoPrice: latest.potato || 0,
      seedBarleyPrice: latest.barley || 0
    });
  } catch (err) {
    console.error("❌ seed-price.js error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
