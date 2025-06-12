const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema({
  nickname: String,
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },
  token: { type: Number, default: 0 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 }
});

module.exports = mongoose.model('Farm', FarmSchema);
