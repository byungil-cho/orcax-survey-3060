// models/CornConfig.js
const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  // 토큰/팝콘 확률 (0~1)
  tokenRate: { type: Number, required: true },   // ex) 0.9
  popcornRate: { type: Number, required: true }, // ex) 0.1
  // 토큰 분배 테이블 [최고, 중간, 최저]
  tokenTable: { type: [Number], required: true }, // ex) [1000, 900, 800]
}, { _id: false });

const PresetSchema = new mongoose.Schema({
  // 생산 수량별 권장 분배 [최고, 중간, 최저, 팝콘]
  "5":  { type: [Number], default: [2,1,1,1] },
  "7":  { type: [Number], default: [1,3,2,1] },
  "9":  { type: [Number], default: [1,3,4,1] }
}, { _id: false });

const CornConfigSchema = new mongoose.Schema({
  // 단일 문서만 사용 (key="global")
  key: { type: String, unique: true, default: 'global' },

  // 등급별 설정
  grades: {
    A: { type: GradeSchema, required: true },
    B: { type: GradeSchema, required: true },
    C: { type: GradeSchema, required: true },
    D: { type: GradeSchema, required: true },
    E: { type: GradeSchema, required: true },
    F: { type: GradeSchema, required: true },
  },

  // 생산 수량(9/7/5) 분배 프리셋
  preset: { type: PresetSchema, default: () => ({}) },

  // 버전/수정자 로그
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' }
});

module.exports = mongoose.model('CornConfig', CornConfigSchema);
