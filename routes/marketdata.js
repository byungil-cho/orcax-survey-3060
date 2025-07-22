const express = require("express");
const router = express.Router();
const User = require("../models/users");
const MarketProduct = require("../models/marketproducts");

// 유저 보관함
router.post("/user-inventory", async (req, res) => {
  const { kakaoId } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    res.json({
      success: true,
      products: user.products || {},
      water: user.water ?? 0,
      fertilizer: user.fertilizer ?? 0,
      orcx: user.orcx ?? 0
    });
  } catch (e) {
    res.json({ success: false, message: "불러오기 오류" });
  }
});

// 판매
router.post("/sell", async (req, res) => {
  const { kakaoId, product, qty } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    const priceObj = await MarketProduct.findOne({ name: product, active: true, amount: { $gt: 0 } });
    if (!user || !priceObj) return res.json({ success: false, message: "상품 또는 유저 없음" });
    if ((user.products?.[product] || 0) < qty) return res.json({ success: false, message: "수량 부족" });

    // 🟢 실제로 DB에 products 차감 반영!
    user.products[product] -= qty;
    if (user.products[product] <= 0) {
      delete user.products[product];
    }
    user.markModified("products");  // ← 필수!
    user.orcx += priceObj.price * qty;
    await user.save();              // ← 필수!
    res.json({ success: true, orcx: user.orcx, left: user.products[product] || 0 });
  } catch (e) {
    res.json({ success: false, message: "판매 실패" });
  }
});

// 교환
router.post("/exchange", async (req, res) => {
  const { kakaoId, product, qty, exchangeItem } = req.body; // exchangeItem: "water" or "fertilizer"
  try {
    const user = await User.findOne({ kakaoId });
    if (!user || (user.products?.[product] || 0) < qty) return res.json({ success: false, message: "교환 불가" });

    user.products[product] -= qty;
    if (user.products[product] <= 0) {
      delete user.products[product];
    }
    user.markModified("products");  // ← 필수!
    if (exchangeItem === "water") user.water += qty * 3;
    if (exchangeItem === "fertilizer") user.fertilizer += qty * 3;
    await user.save();              // ← 필수!
    res.json({ success: true, left: user.products[product] || 0 });
  } catch (e) {
    res.json({ success: false, message: "교환 실패" });
  }
});

module.exports = router;
