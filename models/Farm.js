const farmSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  token: { type: Number, default: 5 },
  potatoCount: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 2 }, // ✅ 추가
  barleyCount: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 2 } // ✅ 기존 있음
});
