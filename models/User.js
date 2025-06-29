const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: {
    type: String,
    required: true,
    unique: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  orcx: {
    type: Number,
    default: 0,
  },
  water: {
    type: Number,
    default: 0,
  },
  fertilizer: {
    type: Number,
    default: 0,
  },
  seedPotato: {
    type: Number,
    default: 0,
  },
  seedBarley: {
    type: Number,
    default: 0,
  },
  potato: {
    type: Number,
    default: 0,
  },
  // login.js / userdata.js 에서 사용하던 inventory 필드
  inventory: {
    type: [Object],
    default: [],
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
