const express = require("express");
const router = express.Router();
const SeedInventory = require("../models/SeedInventory");

// 씨앗 상태 & 가격
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

// 씨앗 가격만 반환 (선택 사항, 사용 안하면 삭제 가능)
router.get("/price", async (req, res) => {
  try {
    const seed = await SeedInventory.findById("singleton");
    if (!seed) return res.status(404).json({ error: "not found" });

    res.json({
      seedPotatoPrice: seed.seedPotato.price,
      seedBarleyPrice: seed.seedBarley.price,
    });
  } catch (err) {
    console.error("seed.js /price error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
