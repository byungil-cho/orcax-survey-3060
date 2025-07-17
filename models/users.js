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

  growth: {
    potato: { type: Number, default: 0 },
    barley: { type: Number, default: 0 }
  },

  // 🚩 감자/보리 보관함 (수확분)
  storage: {
    gamja: { type: Number, default: 0 },  // 수확한 감자
    bori: { type: Number, default: 0 }    // 수확한 보리
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
