const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  barleyCount: Number,
  seedPotato: Number,
  seedBarley: Number
});

const Farm = mongoose.models.Farm || mongoose.model('Farm', farmSchema);

module.exports = Farm;