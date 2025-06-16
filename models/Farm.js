const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  farmName: { type: String, default: "" },
  seed: { type: Number, default: 2 },          // 씨감자
  barleySeed: { type: Number, default: 2 },    // 씨보리 ✅ 추가
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 10 },
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Farm', farmSchema);
