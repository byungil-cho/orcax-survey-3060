const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

// 씨앗 상태 및 가격 조회 (프론트와 type 일치시킴!)
router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    // type: "seedPotato"→"gamja", "seedBarley"→"bori"로 매핑
    const result = stocks.map(item => ({
      type:
        item.type === "seedPotato" ? "gamja"
      : item.type === "seedBarley" ? "bori"
      : item.type,
      stock: item.count,    // ⭐ stock=DB의 count 필드 사용
      price: item.price     // ⭐ price 필드 추가 (SeedStock.js도 price 필수!)
    }));
    res.json(result);
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
