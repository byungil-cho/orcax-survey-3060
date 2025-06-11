
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

// ✅ 중복 선언 방지 방식 적용
module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
