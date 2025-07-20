const mongoose = require('mongoose');
const SeedStockSchema = new mongoose.Schema({
  type: { type: String, enum: ['seedPotato', 'seedBarley'], required: true },
  count: { type: Number, default: 0 },
  price: { type: Number, default: 2 }   // ⭐ price 필드 추가!
});
module.exports = mongoose.model('SeedStock', SeedStockSchema);
