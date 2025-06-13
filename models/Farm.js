const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 5 },
  barleyCount: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 2 },
  seedPotato: { type: Number, default: 0 } // ✅ 이 줄 추가
});

module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
