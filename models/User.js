const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  orcx: { type: Number, default: 0 },               // 토큰
  water: { type: Number, default: 0 },              // 물
  fertilizer: { type: Number, default: 0 },         // 거름

  seedPotato: { type: Number, default: 0 },         // 씨감자
  potatoCount: { type: Number, default: 0 },        // 감자 수확 수
  seedBarley: { type: Number, default: 0 },         // ✅ 씨보리
  barleyCount: { type: Number, default: 0 },        // ✅ 보리 수확 수

  harvestCount: { type: Number, default: 0 },       // 누적 수확 횟수
  inventory: [
    {
      type: { type: String },
      count: { type: Number, default: 1 }
    }
  ],

  lastRecharge: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
