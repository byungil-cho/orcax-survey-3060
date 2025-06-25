const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String },
  wallet: { type: String, unique: true, sparse: true },
  seedPotato: { type: Number, default: 2 },
  seedBarley: { type: Number, default: 2 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 10 },
});

module.exports = mongoose.model('User', userSchema);
