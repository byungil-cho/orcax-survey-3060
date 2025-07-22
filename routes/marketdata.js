// routes/marketdata.js
const express = require("express");
const router = express.Router();
const User = require("../models/users");
const MarketProduct = require("../models/marketproducts"); // 반드시 추가

// *** price-board 라우터는 server-unified.js에서만 관리 ***

// 2. 유저 보관함(가공식품 전체, 자원 포함!)
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

// 3. ORCX로 판매 (전광판 등록 제품만)
router.post("/sell", async (req, res) => {
  const { kakaoId, product, qty } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    // **반드시 marketproducts 컬렉션에서 검색!**
    const priceObj = await MarketProduct.findOne({ name: product, active: true, amount: { $gt: 0 } });
    if (!user || !priceObj) return res.json({ success: false, message: "상품 또는 유저 없음" });
    if ((user.products?.[product] || 0) < qty) return res.json({ success: false, message: "수량 부족" });

    // 수량 차감, ORCX 지급
    user.products[product] -= qty;
    if (user.products[product] <= 0) {
      delete user.products[product];
      user.markModified("products"); // [필수!] 몽구스가 삭제 감지
    }
    user.orcx += priceObj.price * qty;
    await user.save();
    res.json({ success: true, orcx: user.orcx, left: user.products[product] || 0 });
  } catch (e) {
    res.json({ success: false, message: "판매 실패" });
  }
});

// 4. 물/거름 교환 (전광판 미등록 제품만)
router.post("/exchange", async (req, res) => {
  const { kakaoId, product, qty, exchangeItem } = req.body; // exchangeItem: "water" or "fertilizer"
  try {
    const user = await User.findOne({ kakaoId });
    if (!user || (user.products?.[product] || 0) < qty) return res.json({ success: false, message: "교환 불가" });

    // 교환 비율 1:3 (예시)
    user.products[product] -= qty;
    if (user.products[product] <= 0) {
      delete user.products[product];
      user.markModified("products"); // [필수!] 몽구스가 삭제 감지
    }
    if (exchangeItem === "water") user.water += qty * 3;
    if (exchangeItem === "fertilizer") user.fertilizer += qty * 3;
    await user.save();
    res.json({ success: true, left: user.products[product] || 0 });
  } catch (e) {
    res.json({ success: false, message: "교환 실패" });
  }
});

module.exports = router;
