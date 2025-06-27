const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },

  // 자원 (토큰 및 농자재)
  orcx: { type: Number, default: 10 },           // 초기 지급
  water: { type: Number, default: 10 },          // 초기 지급
  fertilizer: { type: Number, default: 10 },     // 초기 지급
  seedPotato: { type: Number, default: 0 },      // 자원: 씨감자
  seedBarley: { type: Number, default: 0 },      // 자원: 씨보리

  // 농산물 수확량
  potatoCount: { type: Number, default: 0 },
  barleyCount: { type: Number, default: 0 },

  // 성장 기록
  harvestCount: { type: Number, default: 0 },

  // 보관소 (가공식품, 아이템 등)
  inventory: { type: [String], default: [] },

  // 농장이름 (닉네임과 별개로 저장 가능)
  farmName: { type: String, default: '' },

  // 유저 생성 시간
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
