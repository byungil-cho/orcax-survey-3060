const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  orcx: { type: Number, default: 10 },       // 토큰
  water: { type: Number, default: 10 },      // 물
  fertilizer: { type: Number, default: 10 }, // 거름
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },
  harvestCount: { type: Number, default: 0 },
  inventory: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);