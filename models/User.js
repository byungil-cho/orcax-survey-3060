// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId:   { type: String, required: true, unique: true },
  nickname:  { type: String, required: true },
  orcx:      { type: Number, default: 0 },
  water:     { type: Number, default: 0 },
  fertilizer:{ type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
