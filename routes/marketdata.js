// routes/marketdata.js
const express = require('express');
const router = express.Router();

const User = require('../models/user'); // 유저 모델
const Market = require('../models/market'); // 마켓 시세/거래내역 (없으면 생성)

// [1] 유저의 모든 가공제품 정보 가져오기
router.post('/get-user-products', async (req, res) => {
  const { kakaoId } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    return res.json({
      success: true,
      products: user.products || {},
      orcx: user.orcx || 0
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

// [2] 마켓 전광판 정보(시세, 거래내역, 전체 집계)
router.get('/get-market-board', async (req, res) => {
  try {
    const board = await Market.findOne({ key: "market_board" });
    return res.json({ success: true, board });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

// [3] 내 가공제품 판매 (ORCX 교환)
router.post('/sell-product', async (req, res) => {
  const { kakaoId, productName, amount } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    let cnt = user.products?.[productName] || 0;
    if (cnt < amount) return res.json({ success: false, message: "수량 부족" });

    // 가격 정보 불러오기
    const market = await Market.findOne({ key: "market_board" });
    const price = market?.prices?.[productName] || 1;

    // 차감, ORCX 지급
    user.products[productName] -= amount;
    if (user.products[productName] <= 0) delete user.products[productName];
    user.orcx = (user.orcx || 0) + price * amount;
    await user.save();

    // 거래내역 기록
    await Market.updateOne(
      { key: "market_board" },
      {
        $inc: { [`sold.${productName}`]: amount },
        $push: { history: { kakaoId, productName, amount, date: new Date() } }
      },
      { upsert: true }
    );
    return res.json({ success: true, orcx: user.orcx });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

// [4] 교환(제품 → 물/거름 등)
router.post('/exchange', async (req, res) => {
  const { kakaoId, productName, amount, exchangeItem, exchangeRate } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    let cnt = user.products?.[productName] || 0;
    if (cnt < amount) return res.json({ success: false, message: "수량 부족" });

    // 차감
    user.products[productName] -= amount;
    if (user.products[productName] <= 0) delete user.products[productName];

    // 자원 지급
    if (exchangeItem === "water") user.water += amount * (exchangeRate || 1);
    if (exchangeItem === "fertilizer") user.fertilizer += amount * (exchangeRate || 1);
    await user.save();

    return res.json({ success: true, water: user.water, fertilizer: user.fertilizer });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
