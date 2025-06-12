const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nickname: String,
  product: String,
  type: String, // 'potato' or 'barley'
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
