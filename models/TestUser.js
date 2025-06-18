const mongoose = require("mongoose");

const testUserSchema = new mongoose.Schema({
  nickname: String,
  orcx: Number,
  farmingCount: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  harvestCount: Number,
  inventory: Array,
  exchangeLogs: Array,
  lastRecharge: Number,
}, { collection: "test.users" }); // 여기 주의!

module.exports = mongoose.model("TestUser", testUserSchema);
