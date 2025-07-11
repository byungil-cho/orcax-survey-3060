const mongoose = require('mongoose');

const seedPriceSchema = new mongoose.Schema({
  potato: { type: Number, default: 1 },  // 감자 가격 (ORCX)
  barley: { type: Number, default: 1 }   // 보리 가격 (ORCX)
});

module.exports = mongoose.model('SeedPrice', seedPriceSchema);
