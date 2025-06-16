
const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  farmName: String,
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 5 },
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 2 },
  seedBarley: { type: Number, default: 2 },
  productStorage: { type: Array, default: [] },   // 가공된 제품 목록
  materialStorage: { type: Array, default: [] }   // 자재 교환된 물품
});

module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
