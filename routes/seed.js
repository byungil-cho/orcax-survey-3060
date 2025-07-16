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

/**
 * 씨앗 상태+가격 한번에 반환 (GET /api/seed/status)
 * DB의 seedstocks 콜렉션에서 type: 'gamja'/'bori' 사용
 *  - 반드시 DB의 type 필드값을 'gamja', 'bori'로 맞춰야 함 (한글/공백/대소문자 NO!)
 */
router.get('/status', async (req, res) => {
  try {
    // 씨감자(stock, price)
    const potatoStock = await SeedStocks.findOne({ type: 'gamja' });
    console.log("감자 스톡:", potatoStock);
    // 씨보리(stock, price)
    const barleyStock = await SeedStocks.findOne({ type: 'bori' });
    console.log("보리 스톡:", barleyStock);

    // 예비: seedprices (추후 가격변동시 사용 가능)
    let pricePotato = 0, priceBarley = 0;
    const priceDoc = await SeedPrices.findOne();
    if (priceDoc) {
      pricePotato = priceDoc.potato;
      priceBarley = priceDoc.barley;
    }
    // 우선순위: seedstocks에 price 필드 있으면 이 값으로
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

module.exports = router;
