// models/CornData.js
const mongoose = require('mongoose');

const CornDataSchema = new mongoose.Schema(
  {
    kakaoId: { type: String, required: true, index: true, unique: true },
    nickname: { type: String, default: '' },

    // 옥수수 쪽 전용 자산
    seedCorn: { type: Number, default: 0 },  // 씨옥수수
    corn: { type: Number, default: 0 },      // 수확 옥수수
    popcorn: { type: Number, default: 0 },   // 팝콘

    additives: {
      salt: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },

    level: { type: Number, default: 0 },
  },
  {
    collection: 'corn_data',
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('CornData', CornDataSchema);
