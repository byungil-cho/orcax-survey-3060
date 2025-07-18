const express = require("express");
const router = express.Router();
const SeedStock = require("../models/SeedStock");  // 운영자 씨앗 보관소 모델

// 씨앗 재고 및 가격 전체 리스트 반환
router.get("/status", async (req, res) => {
  try {
    // 씨감자, 씨보리 등 운영자 보관소에 저장된 모든 씨앗 정보 불러오기
    const stocks = await SeedStock.find({});

    // [{type, stock, price}, ...] 배열로 변환
    const result = stocks.map(item => ({
      type: item.type,      // "gamja" 또는 "bori"
      stock: item.stock,    // 씨앗 재고 수량
      price: item.price     // 씨앗 가격
    }));

    res.json(result); // 프론트(gamja-shop.html)가 기대하는 구조
  } catch (err) {
    console.error("❌ /api/seed/status 오류", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
