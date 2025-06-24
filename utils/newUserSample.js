// 예시 위치: routes/auth.js 또는 controllers/userController.js 내부
const newUser = new User({
  userId,
  nickname,
  potatoCount: 0,
  water: 10,
  fertilizer: 10,
  token: 10,
  orcx: 10,
  seedPotato: 2,      // ✅ 씨감자 자동 지급
  seedBarley: 2,      // ✅ 씨보리 자동 지급
  farmingCount: 0,
  harvestCount: 0,
  inventory: [],
  exchangeLogs: [],
  lastRecharge: Date.now()
});
await newUser.save();