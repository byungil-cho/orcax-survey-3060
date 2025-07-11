// routes/seed.js
const express = require("express");
const router = express.Router();
const SeedPrice = require("../models/SeedPrice");

// 가격 조회
router.get("/price", async (req, res) => {
  try {
    const prices = await SeedPrice.find({});
    const result = {};
    prices.forEach((s) => {
      result[s.type] = s.price;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "가격 조회 실패" });
  }
});

module.exports = router;
