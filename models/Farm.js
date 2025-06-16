
const mongoose = require("mongoose");
module.exports = mongoose.model("Farm", new mongoose.Schema({
  nickname: String,
  farmName: String,
  createdAt: { type: Date, default: Date.now }
}));
