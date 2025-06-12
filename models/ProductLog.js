const mongoose = require('mongoose');

const ProductLogSchema = new mongoose.Schema({
  nickname: String,
  product: String,
  quantity: Number,
  createdAt: Date
});

module.exports = mongoose.model('ProductLog', ProductLogSchema);
