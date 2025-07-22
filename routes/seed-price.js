const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// SeedStock 모델: type(씨앗 종류), price(가격), stock(재고)
const SeedStock = mongoose.model("seedstocks", new mongoose.Schema({
  type: String,      // "gamja" 또는 "bori"
  price: Number,     // 씨앗 가격
  stock: Number      // 씨앗 재고
}, { strict: false }));

// 가격/재고 전체 조회 (관리자, 숍, 유저 모두 사용)
router.get("/status", async (req, res) => {
  try {
    const list = await SeedStock.find({});
    res.json(list.map(x => ({
      type: x.type,
      stock: x.stock,
      price: x.price
    })));
  } catch (e) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 씨앗 가격 개별 변경 (관리자 모드)
router.post("/price", async (req, res) => {
  const { type, price } = req.body; // type: "gamja" | "bori"
  try {
    const updated = await SeedStock.findOneAndUpdate(
      { type },
      { $set: { price: Number(price) } },
      { upsert: true, new: true }
    );
    res.json({ success: true, type: updated.type, price: updated.price });
  } catch (e) {
    res.status(500).json({ success: false, message: "가격 변경 실패" });
  }
});

module.exports = router;
