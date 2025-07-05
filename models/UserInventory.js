// models/UserInventory.js
const mongoose = require('mongoose');

const UserInventorySchema = new mongoose.Schema({
  kakaoId: {
    type: String,
    required: true,
    unique: true
  },
  seedPotato: {
    type: Number,
    default: 0
  },
  seedBarley: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserInventory', UserInventorySchema);
