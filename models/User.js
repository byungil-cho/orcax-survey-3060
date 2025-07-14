const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  orcx: { type: Number, default: 0 },       // 🪙 보유 토큰
  물: { type: Number, default: 0 },         // 💧
  거름: { type: Number, default: 0 },       // 🌿
  씨앗감자: { type: Number, default: 0 },   // 🥔
  씨앗보리: { type: Number, default: 0 },   // 🌾
  감자: { type: Number, default: 0 },       // 🥔
  보리: { type: Number, default: 0 }        // 🌾
}, {
 strict: false // 🔥 이거 추가!!
});

module.exports = mongoose.model('User', userSchema);
