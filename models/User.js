// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String },
  potato: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
  orcx: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
  inventory: [{ name: String, count: Number }]
});

module.exports = mongoose.model('User', UserSchema);
