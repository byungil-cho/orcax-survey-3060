const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/", async (req, res) => {
  try {
    const stock = await SeedStock.findOne();

    res.json({
      success: true,
      seedPotato: stock?.seedPotato ?? 0,
      seedBarley: stock?.seedBarley ?? 0
    });
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
