// models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  kakaoId: {
    type: String,
    required: true,
    unique: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  token: {
    type: Number,
    default: 10, // ✅ ORCX 토큰
  },
  water: {
    type: Number,
    default: 10,
  },
  fertilizer: {
    type: Number,
    default: 10,
  },
  seedPotato: {
    type: Number,
    default: 0,
  },
  seedBarley: {
    type: Number,
    default: 0, // ✅ 보리 씨앗
  },
  potatoCount: {
    type: Number,
    default: 0,
  },
  barleyCount: {
    type: Number,
    default: 0, // ✅ 보리 수확량
  },
  harvestCount: {
    type: Number,
    default: 0,
  },
  farmingCount: {
    type: Number,
    default: 0,
  },
  growthPoint: {
    type: Number,
    default: 0,
  },
  inventory: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model("User", userSchema);
