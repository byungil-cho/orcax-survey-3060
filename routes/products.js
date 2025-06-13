const express = require("express");
const router = express.Router();
const Product = require("../models/product");

// 기존 POST 라우트 유지
router.post("/", async (req, res) => {
  try {
    const { nickname, productName, productType, quantity } = req.body;
    let existing = await Product.findOne({ nickname, productName });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
    } else {
      const newProduct = new Product({ nickname, productName, productType, quantity });
      await newProduct.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 새로 추가된 GET 라우트
router.get("/:nickname", async (req, res) => {
  try {
    const nickname = req.params.nickname;
    const products = await Product.find({ nickname });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
