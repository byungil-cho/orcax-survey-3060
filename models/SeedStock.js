const mongoose = require('mongoose');
const SeedStockSchema = new mongoose.Schema({
  type: { type: String, enum: ['gamja', 'bori'], required: true },
  stock: { type: Number, default: 0 },    // ← count → stock으로 필드명 수정!
  price: { type: Number, default: 2 }
});
module.exports = mongoose.model('SeedStock', SeedStockSchema);
