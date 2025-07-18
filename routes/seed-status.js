const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    // 필드명 변환: seedType→type, quantity→stock, price 유지
    const result = stocks.map(item => ({
      type: item.seedType,      // 프론트에서 'type'으로 찾음 ("gamja"/"bori")
      stock: item.quantity,     // 프론트에서 'stock'으로 표시
      price: item.price ?? "-", // 프론트에서 'price'로 표시
    }));
    res.json(result);
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
