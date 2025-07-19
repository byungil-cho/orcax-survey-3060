const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    // 배열: [{type, stock, price}]
    const result = stocks.map(item => ({
      type: item.type,     // "gamja", "bori"
      stock: item.stock,   // 수량
      price: item.price    // 가격
    }));
    res.json(result);
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
