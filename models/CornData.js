const mongoose = require('mongoose');

const CornDataSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, index: true, unique: true },
  nickname: { type: String, default: '' },
  seedCorn: { type: Number, default: 0 },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
  },
  level: { type: Number, default: 0 },
}, { collection: 'corn_data', timestamps: true });

module.exports = mongoose.model('CornData', CornDataSchema);
