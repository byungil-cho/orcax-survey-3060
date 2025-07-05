// models/SeedInventory.js
const mongoose = require('mongoose');

const seedSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  seedPotato: {
    quantity: { type: Number, default: 100 },
    price: { type: Number, default: 2 }
  },
  seedBarley: {
    quantity: { type: Number, default: 100 },
    price: { type: Number, default: 2 }
  }
});

module.exports = mongoose.model('SeedInventory', seedSchema);
