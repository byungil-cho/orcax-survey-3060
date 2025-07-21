// models/markets.js
const mongoose = require("mongoose");
const MarketSchema = new mongoose.Schema({
  name: String,      // 제품명 (예: "내마을감자칩")
  price: Number      // ORCX 단가 (예: 12)
});
module.exports = mongoose.model("Market", MarketSchema);
