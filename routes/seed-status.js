const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});

    const result = {
      seedPotato: 0,
      seedBarley: 0
    };

    for (const item of stocks) {
      const type = item.type?.toLowerCase();
      const count = item.quantity ?? 0;

      if (type?.includes("potato")) result.seedPotato = count;
      else if (type?.includes("barley")) result.seedBarley = count;
    }

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
