
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  orcx: { type: Number, default: 10 },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },
  harvestCount: { type: Number, default: 0 },
  inventory: { type: [String], default: [] }
});

module.exports = mongoose.model('User', userSchema);
