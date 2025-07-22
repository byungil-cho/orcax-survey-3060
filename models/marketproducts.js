// models/marketproducts.js
const mongoose = require('mongoose');

const marketProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  amount: Number,
  active: { type: Boolean, default: true },
});

module.exports = mongoose.models.MarketProduct || mongoose.model('MarketProduct', marketProductSchema);
