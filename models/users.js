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
  // 기타 필요한 필드들 추가
});

// 이 부분이 핵심입니다!
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
