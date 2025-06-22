const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  nickname: String,
  potatoCount: Number,
  water: Number,
  fertilizer: Number,
  token: Number,
  inventory: [{ name: String, count: Number }]
});

module.exports = mongoose.model("User", userSchema);
