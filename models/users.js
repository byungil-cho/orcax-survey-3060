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
  email: {
    type: String,
    unique: true,
    sparse: true, // null 중복 허용 (중요)
  },
  orcx: {
    type: Number,
    default: 10,
  },
  water: {
    type: Number,
    default: 10,
  },
  fertilizer: {
    type: Number,
    default: 10,
  },
  inventory: {
    type: Array,
    default: [],
  },
  potato: {
    type: Number,
    default: 0,
  },
  bori: {
    type: Number,
    default: 0,
  },
  seedBarley: {
    type: Number,
    default: 0,
  },
  seedPotato: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
