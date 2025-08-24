// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  tokens: { type: Number, default: 0 }, // 또는 orcx를 쓰면 프론트에서 tokens || orcx 로 호환
  orcx: { type: Number, default: 0 },
  storage: {
    gamja: { type: Number, default: 0 },
    bori:  { type: Number, default: 0 }
  },
  growth: {
    potato: { type: Number, default: 0 },
    barley: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
