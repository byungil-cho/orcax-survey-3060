const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  orcx: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 }
}, { timestamps: true });

// 이미 등록된 모델이 있으면 그걸 쓰고, 없으면 새로 등록
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
