const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  nickname: String,
  potatoCount: Number,
  water: Number,
  fertilizer: Number,
  token: Number,
  orcx: Number,
  farmingCount: Number,
  harvestCount: Number,
  seedPotato: { type: Number, default: 0 },  // ✅ 씨감자
  seedBarley: { type: Number, default: 0 },  // ✅ 씨보리
  inventory: [{ name: String, count: Number }],
  exchangeLogs: Array,
  lastRecharge: Number
});

module.exports = mongoose.model("User", userSchema);