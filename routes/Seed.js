const mongoose = require('mongoose');

const seedSchema = new mongoose.Schema({
  name: String,       // '씨앗감자' or '씨앗보리'
  quantity: Number,   // 남은 수량
  price: Number       // ORCX 가격
});

module.exports = mongoose.model('Seed', seedSchema);
