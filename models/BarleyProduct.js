const mongoose = require('mongoose');

const barleyProductSchema = new mongoose.Schema({
  nickname: String,
  product: String,
  quantity: Number
});

module.exports = mongoose.model('BarleyProduct', barleyProductSchema);
