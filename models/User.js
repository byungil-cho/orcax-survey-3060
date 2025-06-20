// models/User.js - 사용자 정보 스키마

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  tokens: { type: Number, default: 10 },
  씨감자: { type: Number, default: 2 },
  씨보리: { type: Number, default: 2 },
  물: { type: Number, default: 10 },
  거름: { type: Number, default: 10 },
  감자수확: { type: Number, default: 0 },
  보리수확: { type: Number, default: 0 },
  레벨: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
