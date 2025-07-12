const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/", async (req, res) => {
  try {
    const potato = await SeedStock.findOne({ 유형: "씨앗감자" });
    const barley = await SeedStock.findOne({ 유형: "씨앗보리" });

    res.json({
      seedPotato: potato?.수량 || 0,
      seedBarley: barley?.수량 || 0
    });
  } catch (err) {
    console.error("종자 재고 오류:", err);
    res.status(500).json({ error: "종자 재고 DB 오류" });
  }
});

module.exports = router;
