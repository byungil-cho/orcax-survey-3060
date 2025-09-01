// 예: models/user.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  tokens: { type: Number, default: 0 },
  // 신규 구조
  inventory: {
    water:      { type: Number, default: 0 },
    fertilizer: { type: Number, default: 0 },
    seedPotato: { type: Number, default: 0 },
    seedBarley: { type: Number, default: 0 },
  },
  // 예전 레거시 필드가 남아 있어도 무방
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
});

// ✅ 모든 응답에서 양쪽 표기(레거시/신규)를 동시에 보장
function compatTransform(doc, ret) {
  const inv = ret.inventory || {};
  const seedPotato = Number(inv.seedPotato ?? ret.seedPotato ?? 0);
  const seedBarley = Number(inv.seedBarley ?? ret.seedBarley ?? 0);

  ret.seedPotato = seedPotato;    // 레거시 위치 보장
  ret.seedBarley = seedBarley;
  ret.inventory = {               // 신규 위치도 동기화
    ...inv,
    seedPotato,
    seedBarley,
  };
  return ret;
}
UserSchema.set('toJSON',  { virtuals: true, transform: compatTransform });
UserSchema.set('toObject',{ virtuals: true, transform: compatTransform });

module.exports = mongoose.model('User', UserSchema);
