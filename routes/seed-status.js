const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    // type: "seedPotato"→"gamja", "seedBarley"→"bori"로 매핑
    const result = stocks.map(item => ({
      type:
        item.type === "seedPotato" ? "gamja"
      : item.type === "seedBarley" ? "bori"
      : item.type,
      stock: item.stock,    // ⭐ 무조건 stock!
      price: item.price
    }));
    res.json(result);
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
