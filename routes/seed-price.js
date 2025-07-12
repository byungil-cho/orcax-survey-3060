const express = require("express");
const router = express.Router();
const SeedPrice = require("../models/SeedPrice");

router.get("/", async (req, res) => {
  try {
    const price = await SeedPrice.findOne();
    res.json({
      seedPotato: price?.감자 || 0,
      seedBarley: price?.보리 || 0
    });
  } catch (err) {
    console.error("종자 가격 오류:", err);
    res.status(500).json({ error: "종자 가격 불러오기 실패" });
  }
});

module.exports = router;
