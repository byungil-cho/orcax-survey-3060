const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  farmName: {
    type: String,
    default: ''
  },
  potatoCount: {
    type: Number,
    default: 0
  },
  barleyCount: {
    type: Number,
    default: 0
  },
  water: {
    type: Number,
    default: 0
  },
  fertilizer: {
    type: Number,
    default: 0
  },
  token: {
    type: Number,
    default: 0
  },
  growth: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', userSchema);
