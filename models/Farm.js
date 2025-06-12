const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  barley: Number,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number
});

module.exports = mongoose.model('Farm', farmSchema);
