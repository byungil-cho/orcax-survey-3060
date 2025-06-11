
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const farmRoutes = require('./routes/farm'); 
const Farm = require('./models/Farm');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());
app.use('/api/farm', farmRoutes);

app.use(cors({
  origin: '*', // 또는 'https://byungil-cho.github.io' 로 명시
}));


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

// ✅ 최초 입장
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

// ✅ 유저 단일 정보 조회
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

// ✅ 유저 전체 정보 조회
app.get('/api/users', async (req, res) => {
  try {
    const users = await Farm.find({}, 'nickname water fertilizer token potatoCount seedPotato');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 유저 정보 저장
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

// ✅ 마켓 시세 정보 (전광판)
app.get('/api/market/prices', (req, res) => {
  res.json({
    notice: "📈 오늘도 감자 시세가 출렁입니다!",
    prices: [
      { type: "감자칩", count: 120, price: 15 },
      { type: "감자전", count: 80, price: 20 },
      { type: "감자튀김", count: 60, price: 30 }
    ]
  });
});

// ✅ 마켓 기본 목록 (사용 안 해도 됨)
app.get('/api/market', (req, res) => {
  res.json([
    { name: "감자칩", price: 15 },
    { name: "감자전", price: 20 },
    { name: "감자튀김", price: 30 }
  ]);
});

// ✅ 자원 사용 (물/거름)
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

// ✅ 씨감자 사용
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

// ✅ 씨감자 구매
app.post('/api/buy-seed', async (req, res) => {
  try {
    const { nickname, amount } = req.body;
    if (!nickname || !amount) return res.status(400).json({ success: false, message: '잘못된 요청' });

    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '사용자 없음' });

    const totalCost = 2 * amount;
    if (user.token < totalCost) return res.json({ success: false, message: '토큰 부족' });

    user.token -= totalCost;
    user.seedPotato = (user.seedPotato || 0) + amount;
    await user.save();

    res.json({ success: true, message: '씨감자 구매 완료' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

// ✅ 개인 보관함 조회 (inventory 기준)
app.get('/api/storage/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json([]);
    res.json(user.inventory || []);
  } catch (err) {
    console.error("보관소 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 토큰 잔액 조회
app.get('/api/user/token/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json({ token: 0 });
    res.json({ token: user.token || 0 });
  } catch (err) {
    console.error("토큰 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 제품 판매 처리
app.post('/api/market/sell', async (req, res) => {
  const { kakaoId, type, count } = req.body;
  try {
    const user = await Farm.findOne({ nickname: kakaoId });
    if (!user) return res.status(404).json({ error: "유저 없음" });

    const item = user.inventory.find(i => i.type === type);
    if (!item || item.count < count) {
      return res.status(400).json({ error: "수량 부족 또는 항목 없음" });
    }

    item.count -= count;
    if (item.count === 0) {
      user.inventory = user.inventory.filter(i => i.type !== type);
    }

    user.token += count * 10;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "판매 처리 실패" });
  }
});

// ✅ 서버 상태 확인
app.get('/', (req, res) => {
  res.send('✅ OrcaX 감자 서버 정상 작동 중!');
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
