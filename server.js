const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 완료'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ Farm 스키마 정의
const farmSchema = new mongoose.Schema({
  nickname: String,
  token: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  inventory: Array,
  seedPotato: { type: Number, default: 0 }
});
const Farm = mongoose.model('Farm', farmSchema);

/* ✅ 최초 입장: 없으면 생성 + 자산 지급 */
app.post('/api/login', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).json({ success: false, message: '닉네임 필요' });

  let user = await Farm.findOne({ nickname });
  if (!user) {
    user = await Farm.create({
      nickname,
      token: 10,
      water: 10,
      fertilizer: 10,
      potatoCount: 0,
      seedPotato: 2,
      inventory: []
    });
    console.log(`🆕 새 유저 생성됨: ${nickname}`);
  }
  res.json({ success: true, user });
});

// ✅ 단일 유저 조회
app.get('/api/userdata', async (req, res) => {
  try {
    const { nickname } = req.query;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ message: "유저 없음" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 유저 정보 업데이트
app.post('/api/userdata', async (req, res) => {
  try {
    const {
      nickname, token, water,
      fertilizer, inventory, potatoCount, seedPotato
    } = req.body;
    const updated = await Farm.findOneAndUpdate(
      { nickname },
      { token, water, fertilizer, inventory, potatoCount, seedPotato },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "업데이트 실패" });
  }
});

// ✅ 마켓 상품 조회
app.get('/api/market', (req, res) => {
  res.json([
    { name: "감자칩", price: 15 },
    { name: "감자전", price: 20 },
    { name: "감자튀김", price: 30 }
  ]);
});

// ✅ 물/거름 사용
app.post('/api/use-resource', async (req, res) => {
  const { nickname, type } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

  if (type === "water" && user.water > 0) user.water--;
  else if (type === "fertilizer" && user.fertilizer > 0) user.fertilizer--;
  else return res.json({ success: false, message: "자원 부족" });

  await user.save();
  res.json({ success: true });
});

// ✅ 감자 수확
app.post('/api/harvest', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

  const harvested = 5;
  user.potatoCount = (user.potatoCount || 0) + harvested;
  await user.save();

  res.json({ success: true, harvested });
});

// ✅ 씨감자 교환
app.post('/api/exchange-seed', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });

  if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

  const seedPrice = 2;
  if ((user.token ?? 0) < seedPrice) {
    return res.json({ success: false, message: "ORCX 부족" });
  }

  user.token -= seedPrice;
  user.seedPotato += 1;
  await user.save();

  res.json({ success: true, seedGained: 1 });
});

// ✅ 씨감자 사용 (추가)
app.post('/api/use-seed', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });

  if (!user || user.seedPotato <= 0) {
    return res.json({ success: false, message: "씨감자가 부족합니다." });
  }

  user.seedPotato -= 1;
  await user.save();
  res.json({ success: true, seedPotato: user.seedPotato });
});

// ✅ 기본 루트
app.get('/', (req, res) => {
  res.send('✅ OrcaX 감자 서버 정상 작동 중!');
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
