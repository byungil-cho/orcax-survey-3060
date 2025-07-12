const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock"); // 모델 이름 확인 필요

router.get("/", async (req, res) => {
  try {
    const stocks = await SeedStock.find({}); // 전체 재고
    const result = {
      seed_potato: 0,
      seed_barley: 0
    };

    for (const item of stocks) {
      const type = item["유형"];
      const count = item["수량"];
      if (type.includes("감자")) result.seed_potato = count;
      else if (type.includes("보리")) result.seed_barley = count;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ seed-status 오류:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
