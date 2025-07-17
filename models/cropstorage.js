// models/cropstorage.js
const mongoose = require('mongoose');

const CropStorageSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true }, // 유저 카카오ID(고유)
  potato: { type: Number, default: 0 },      // 감자 보유
  barley: { type: Number, default: 0 },      // 보리 보유
  corn: { type: Number, default: 0 },        // 옥수수(확장시)
  // 필요하면 더 추가: wheat, rice, 가공품 등등
}, { timestamps: true }); // 생성/수정 시간 자동 기록

module.exports = mongoose.model('CropStorage', CropStorageSchema, 'cropstorages');
