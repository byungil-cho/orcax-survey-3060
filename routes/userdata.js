const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nickname: String,
  orcx: Number,
  farmingCount: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  harvestCount: Number,
  inventory: Array,
  exchangeLogs: Array,
  lastRecharge: Number
});

module.exports = mongoose.model("User", userSchema);