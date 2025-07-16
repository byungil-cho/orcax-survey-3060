// Express 기반 예시
const express = require('express');
const router = express.Router();

const SeedStocks = require('../models/SeedStock');     // 씨앗 재고 모델
const SeedPrices = require('../models/SeedPrice');     // 씨앗 가격 모델

// 씨앗 상태+가격 한번에 반환
router.get('/status', async (req, res) => {
  try {
    // 씨앗 재고
    const potatoStock = await SeedStocks.findOne({ type: 'gamja' }); // type, name 등 실제 필드 맞게
    const barleyStock = await SeedStocks.findOne({ type: 'bori' });

    // 씨앗 가격
    // 1) seedprices 콜렉션 활용 (potato, barley)
    let pricePotato = 0, priceBarley = 0;
    const priceDoc = await SeedPrices.findOne();
    if (priceDoc) {
      pricePotato = priceDoc.potato;
      priceBarley = priceDoc.barley;
    }

    // 2) 만약 seedstocks에 price 필드가 있다면
    if (potatoStock && potatoStock.price) pricePotato = potatoStock.price;
    if (barleyStock && barleyStock.price) priceBarley = barleyStock.price;

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
