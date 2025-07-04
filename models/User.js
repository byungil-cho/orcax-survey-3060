// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  kakaoId: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // ✅ 고유하고 필수인 이메일
  token: { type: Number, default: 0 },
  gamja: { type: Number, default: 0 },
  sibori: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
