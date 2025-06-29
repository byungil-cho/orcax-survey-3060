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
  orcx: {
    type: Number,
    default: 0,
  },
  water: {
    type: Number,
    default: 0,
  },
  fertilizer: {
    type: Number,
    default: 0,
  },
  seedPotato: {
    type: Number,
    default: 0,
  },
  seedBarley: {
    type: Number,
    default: 0,
  },
  potato: {
    type: Number,
    default: 0,
  },
  plantedFields: {
    type: [Object],
    default: [],
  },
  lastUpdated: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model("User", userSchema);
