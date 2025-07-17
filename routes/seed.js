const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

// 씨앗 재고 모델 (seedstocks)
const SeedStockSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  price: Number,
  seedType: String,
  type: String // 'gamja' or 'bori'
});
const SeedStocks = mongoose.model('SeedStock', SeedStockSchema, 'seedstocks');

// 씨앗 가격 모델 (seedprices, 옵션)
const SeedPriceSchema = new mongoose.Schema({
  potato: Number,
  barley: Number
});
const SeedPrices = mongoose.model('SeedPrice', SeedPriceSchema, 'seedprices');

// 🚩 유저 모델 연결
const User = require('../models/users');

// 씨앗 상태+가격 반환 (GET /api/seed/status)
router.get('/status', async (req, res) => {
  try {
    const potatoStock = await SeedStocks.findOne({ type: 'gamja' });
    const barleyStock = await SeedStocks.findOne({ type: 'bori' });

    let pricePotato = 0, priceBarley = 0;
    const priceDoc = await SeedPrices.findOne();
    if (priceDoc) {
      pricePotato = priceDoc.potato;
      priceBarley = priceDoc.barley;
    }
    if (potatoStock && typeof potatoStock.price === 'number') pricePotato = potatoStock.price;
    if (barleyStock && typeof barleyStock.price === 'number') priceBarley = barleyStock.price;

    res.json({
      success: true,
      seedPotato: potatoStock ? potatoStock.stock : 0,
      seedBarley: barleyStock ? barleyStock.stock : 0,
      pricePotato: pricePotato ?? 0,
      priceBarley: priceBarley ?? 0
    });
  } catch (err) {
    res.json({
      success: false,
      message: '씨앗 상태/가격 불러오기 실패',
      error: err.message
    });
  }
});

// 🚩 씨앗 구매 라우터 (POST /api/seed/buy)
router.post('/buy', async (req, res) => {
  try {
    const { kakaoId, seedType } = req.body;
    if (!kakaoId || !seedType) return res.json({ success: false, message: "필수 파라미터 없음" });

    // 1. 유저 찾기
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    // 2. 씨앗 정보/가격 가져오기
    const type = seedType === "seedPotato" ? "gamja" : (seedType === "seedBarley" ? "bori" : null);
    if (!type) return res.json({ success: false, message: "잘못된 씨앗 종류" });

    const seedStock = await SeedStocks.findOne({ type });
    if (!seedStock || seedStock.stock < 1) return res.json({ success: false, message: "씨앗 재고 부족" });

    const price = seedStock.price ?? 2;
    if (user.orcx < price) return res.json({ success: false, message: "토큰 부족" });

    // 3. 실제 구매 처리
    user.orcx -= price;
    if (seedType === "seedPotato") user.seedPotato = (user.seedPotato ?? 0) + 1;
    if (seedType === "seedBarley") user.seedBarley = (user.seedBarley ?? 0) + 1;
    await user.save();

    // 4. 씨앗 재고 차감
    seedStock.stock -= 1;
    await seedStock.save();

    res.json({ success: true, message: "구매 완료", orcx: user.orcx, seedPotato: user.seedPotato, seedBarley: user.seedBarley });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
