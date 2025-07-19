// seed-status.js
const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");

router.get("/status", async (req, res) => {
  try {
    const stocks = await SeedStock.find({});
    // 변환: seedType → type, quantity → stock
    const result = stocks.map(item => ({
      type: item.seedType,      // "gamja", "bori"
      stock: item.quantity,     // 필드명 quantity → stock으로 변환!
      price: item.price ?? "-", // 씨앗 가격
    }));
    res.json(result); // 반드시 배열 반환!
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
