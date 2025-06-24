const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nickname: String,
  orcx: Number,
  farmingCount: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  harvestCount: Number,
  seedPotato: { type: Number, default: 0 },  // ✅ 씨감자 필드 추가
  seedBarley: { type: Number, default: 0 },  // ✅ 씨보리 필드 추가
  inventory: Array,
  exchangeLogs: Array,
  lastRecharge: Number
});

module.exports = mongoose.model("User", userSchema);