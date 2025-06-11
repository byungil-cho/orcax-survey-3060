const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  inventory: [
    {
      type: { type: String },
      count: Number
    }
  ],
  seedPotato: Number,
  lastFreeTime: Date,
  freeFarmCount: Number
});

// ✅ 이 줄이 반드시 있어야 오류 방지됨!
module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
