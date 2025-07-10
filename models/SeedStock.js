const mongoose = require('mongoose');

const SeedStockSchema = new mongoose.Schema({
  type: { type: String, required: true },
  quantity: { type: Number, required: true }
});

module.exports = mongoose.models.SeedStock || mongoose.model('SeedStock', SeedStockSchema);
