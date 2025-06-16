const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  farmName: { type: String, default: "" },
  seed: { type: Number, default: 2 },
  barleySeed: { type: Number, default: 2 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 10 },
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },
  potatoProduct: { type: Number, default: 0 },  // 감자칩
  barleyProduct: { type: Number, default: 0 }   // 보리빵
});

module.exports = mongoose.model('Farm', farmSchema);