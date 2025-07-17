const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  email: String,
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
  orcx: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },

  // 🚩 성장포인트 필드 추가!
  growth: {
    potato: { type: Number, default: 0 },
    barley: { type: Number, default: 0 }
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
