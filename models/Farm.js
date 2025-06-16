
const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: String,
  farmName: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  barleyCount: Number,
  products: Array
});

const Farm = mongoose.model('Farm', farmSchema);
module.exports = Farm;
