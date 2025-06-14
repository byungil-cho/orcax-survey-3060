const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nickname: String,
  type: String,         // 제품 이름
  category: String,     // 감자 or 보리
  count: Number         // 수량
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

