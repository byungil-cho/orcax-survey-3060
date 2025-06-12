// models/Farm.js (🧼 깔끔한 버전)
const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  seedPotato: Number,
  barley: Number, // ✅ 보리 수확량
  inventory: [
    {
      type: { type: String },
      count: Number
    }
  ],
  lastFreeTime: Date,
  freeFarmCount: Number
});

// ✅ 모델 중복 선언 방지
module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
