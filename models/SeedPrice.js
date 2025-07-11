// models/SeedPrice.js
const mongoose = require('mongoose');

const SeedPriceSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.models.SeedPrice || mongoose.model('SeedPrice', SeedPriceSchema);
