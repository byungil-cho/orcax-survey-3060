// models/CornData.js
const mongoose = require('mongoose');

const CornDataSchema = new mongoose.Schema(
  {
    kakaoId:   { type: String, required: true, index: true, unique: true },
    nickname:  { type: String, default: '' },
    seed:     { type: Number, default: 0 },
    corn:      { type: Number, default: 0 },
    popcorn:   { type: Number, default: 0 },
    additives: { salt: { type: Number, default: 0 }, sugar: { type: Number, default: 0 } },
    phase:     { type: String, default: 'IDLE' },
    g:         { type: Number, default: 0 },
    plantedAt: { type: Date },
  },
  { collection: 'corn_data', timestamps: true }
);

module.exports = mongoose.model('CornData', CornDataSchema);
