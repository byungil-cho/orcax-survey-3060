const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  seedPotato:   { type: Number, default: 0 },
  seedBarley:   { type: Number, default: 0 },
  water:        { type: Number, default: 0 },
  fertilizer:   { type: Number, default: 0 },
  token:        { type: Number, default: 0 },
  growthPoint:  { type: Number, default: 0 },
  potatoCount:  { type: Number, default: 0 },
  harvestCount: { type: Number, default: 0 },
  farmingCount: { type: Number, default: 0 },
  inventory: [
    {
      name:  { type: String },
      count: { type: Number, default: 1 }
    }
  ],
  lastRecharge: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
