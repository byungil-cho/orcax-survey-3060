// models/users.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  email: String,
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
  orcx: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
  growth: {
    potato: { type: Number, default: 0 },
    barley: { type: Number, default: 0 }
  },
  storage: {
    gamja: { type: Number, default: 0 },
    bori: { type: Number, default: 0 }
  },
  products: { type: Object, default: {} },
  farmName: { type: String, default: '' }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
