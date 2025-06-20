// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
  },
  water: {
    type: Number,
    default: 10,
  },
  fertilizer: {
    type: Number,
    default: 10,
  },
  token: {
    type: Number,
    default: 0,
  },
  seed_potato: {
    type: Number,
    default: 0,
  },
  seed_barley: {
    type: Number,
    default: 0,
  },
  potatoCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
