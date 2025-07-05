const mongoose = require('mongoose');

const seedSchema = new mongoose.Schema({
  type: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 }
});

module.exports = mongoose.model('Seed', seedSchema);
