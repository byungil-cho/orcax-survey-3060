const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  potato: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
  orcx: { type: Number, default: 0 },
  seed: { type: Number, default: 0 },
  sprout: { type: Number, default: 0 },
  inventory: { type: Array, default: [] }
});
