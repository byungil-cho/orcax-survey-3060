const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});

    const result = {
      seed_potato: 0,
      seed_barley: 0
    };

    for (const item of stocks) {
      const type = item.type?.toLowerCase();
      const count = item.count ?? 0;

      if (type === "potato") result.seed_potato = count;
      else if (type === "barley") result.seed_barley = count;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
