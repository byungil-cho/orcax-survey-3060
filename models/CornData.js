// models/CornData.js
const mongoose = require('mongoose');

const CornDataSchema = new mongoose.Schema({
  kakaoId:   { type: String, required: true, index: true, unique: true },
  corn:      { type: Number, default: 0 },
  popcorn:   { type: Number, default: 0 },
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  seeds:     { type: Number, default: 0 },
  phase:     { type: String, default: 'IDLE' }, // IDLE | GROW | STUBBLE
  g:         { type: Number, default: 0 },
  plantedAt: { type: Date }
}, { collection: 'corn_data', timestamps: true });

module.exports = mongoose.model('CornData', CornDataSchema);
