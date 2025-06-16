const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  barleyCount: Number,
  potatoProduct: Object,
  barleyProduct: Object,
  farmName: String,
  barleyName: String
});

module.exports = mongoose.model("Farm", farmSchema);

