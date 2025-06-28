const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: {
    type: String,
    required: true,
    unique: true         // ✅ 중복 불가
  },
  nickname: String,       // 표시용, optional
  orcx: { type: Number, default: 10 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  seedPotato: { type: Number, default: 2 },
  seedBarley: { type: Number, default: 2 },
  potato: { type: Number, default: 0 },
  inventory: { type: Array, default: [] }
});

module.exports = mongoose.model('User', userSchema);
