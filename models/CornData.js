// models/CornData.js
const mongoose = require('mongoose');

const CornItemSchema = new mongoose.Schema({
  color: { type: String, enum: ['yellow','red','black'], default: 'yellow' },
  grade: { type: String, enum: ['A','B','C','D','E','F','폐농', null], default: null },
  plantedAt: { type: Date, default: null },
  day: { type: Number, default: 1 },      // 1..N
  segment: { type: Number, default: 1 },  // 1..5
  waterBuffer: { type: Number, default: 0 },   // 시간(시간 단위)
  fertBuffer: { type: Number, default: 0 },    // 시간(3h 단위 충전)
  growthAccum: { type: Number, default: 0 },   // 현재 구간에서 진행된 시간
  debtHours: { type: Number, default: 0 },     // 0상태 흘린 활성시간
  status: { type: String, enum: ['active','reserved','harvest_ready','finished','failed'], default: 'active' },
  lastTickAt: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { _id: false });

const CornDataSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },

  // 진행 히스토리: 마지막 요소가 현재 진행(endedAt=null)
  corn: { type: [CornItemSchema], default: [] },

  // 농장 상태
  status: { type: String, enum: ['active','reserved','fallow','harvest_ready','failed'], default: 'fallow' },
  fallowSince: { type: Date, default: null },     // 수확 직후 시간 (예약창구 계산에 사용)

  // 예약
  reservation: {
    scheduledAt: { type: Date, default: null },
    createdAt:   { type: Date, default: null }
  },

  // 자원
  popcorn:  { type: Number, default: 0 },
  seed:     { type: Number, default: 0 },
  seeds:    { type: Number, default: 0 }, // 과거 호환 합산용
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },

  // 대출(붉은/검정 로직)
  loan: {
    amount:    { type: Number, default: 0 },
    interest:  { type: Number, default: 0.30 }, // 붉은/검정 팝 30% 공제
    createdAt: { type: Date, default: null }
  }

}, { timestamps: true });

module.exports = mongoose.models.CornData || mongoose.model('CornData', CornDataSchema, 'corn_data');
