const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  orcx: { type: Number, default: 10 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  seedPotato: { type: Number, default: 0 },
  inventory: { type: Array, default: [] },
  lastRecharge: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
