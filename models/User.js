const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  kakaoId:     { type: String, required: true, unique: true },
  nickname:    String,
  orcx:        Number,
  water:       Number,
  fertilizer:  Number,
  seedPotato:  Number,
  potatoCount: Number,
  seedBarley:  Number,
  barleyCount: Number,
  harvestCount:Number,
  inventory:   Array,
  lastRecharge:Date
});

module.exports = mongoose.model('User', UserSchema);
