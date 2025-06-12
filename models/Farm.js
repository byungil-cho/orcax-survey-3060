// models/Farm.js

const mongoose = require('mongoose');

// ✅ 농장 유저 모델
const farmSchema = new mongoose.Schema({
  nickname: String,
  barley: { type: Number, default: 0 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 5 },
  potatoCount: { type: Number, default: 0 }
});
const Farm = mongoose.model('Farm', farmSchema);

// ✅ 보리 제품 모델
const barleyProductSchema = new mongoose.Schema({
  nickname: String,
  product: String,
  quantity: Number
});
const BarleyProduct = mongoose.model('BarleyProduct', barleyProductSchema);

// ✅ 둘 다 export
module.exports = { Farm, BarleyProduct };
