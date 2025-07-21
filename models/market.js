const mongoose = require('mongoose');
const marketSchema = new mongoose.Schema({
  key: String, // "market_board"
  prices: Object, // { '감자칩': 2, ... }
  sold: Object,   // { '감자칩': 99, ... }
  history: Array  // 거래내역 [{kakaoId, productName, amount, date}]
});
module.exports = mongoose.model('Market', marketSchema);
