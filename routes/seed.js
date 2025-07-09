const express = require("express");
const router = express.Router();
const SeedInventory = require("../models/SeedInventory");

router.get("/status", async (req, res) => {
  try {
    const seed = await SeedInventory.findById("singleton");
    if (!seed) return res.status(404).json({ error: "not found" });

    res.json({
      seedPotato: seed.seedPotato.quantity,
      seedBarley: seed.seedBarley.quantity,
      seedPotatoPrice: seed.seedPotato.price,
      seedBarleyPrice: seed.seedBarley.price,
    });
  } catch (err) {
    console.error("seed.js /status error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
