const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true }, // 카카오 닉네임
  farmName: { type: String, default: "" },                  // 농장이름 (main에서 설정)
  seed: { type: Number, default: 2 },                       // 씨감자
  barleySeed: { type: Number, default: 2 },                 // 씨보리 ✅
  water: { type: Number, default: 10 },                     // 물
  fertilizer: { type: Number, default: 10 },                // 거름
  token: { type: Number, default: 10 },                     // ORCX 토큰
  potatoCount: { type: Number, default: 0 },                // 수확된 감자
  barleyCount: { type: Number, default: 0 }                 // 수확된 보리
}, { timestamps: true }); // 생성일, 수정일 자동 포함

module.exports = mongoose.model('Farm', farmSchema);
