// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: String,
  kakaoId: String,
  token: Number,
  gamja: Number,
  sibori: Number,
});

module.exports = mongoose.model('User', userSchema);
