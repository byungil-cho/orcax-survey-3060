// models/Farm.js
const mongoose = require('mongoose');
const farmSchema = new mongoose.Schema({
  nickname: String,
  barley: Number,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number
});
module.exports = mongoose.model('Farm', farmSchema);

// models/BarleyProduct.js
const mongoose = require('mongoose');
const barleyProductSchema = new mongoose.Schema({
  nickname: String,
  product: String,
  quantity: Number
});
module.exports = mongoose.model('BarleyProduct', barleyProductSchema);
