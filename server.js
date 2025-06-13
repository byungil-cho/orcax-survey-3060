const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const farmRoutes = require('./routes/farm'); 
const Farm = require('./models/Farm');

const app = express();
const PORT = 3060;

const barleyRoutes = require('./routes/barley');
app.use('/api', barleyRoutes);

app.use(cors());
app.use(express.json());
app.use('/api/farm', farmRoutes);
app.use('/api', require('./routes/buy-seed'));  // 예시

app.use(cors({
  origin: '*',
}));

app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post("/api/harvest-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ error: "User not found" });

  if ((user.water || 0) < 3 || (user.fertilizer || 0) < 2) {
    return res.status(400).json({ error: "물 또는 거름이 부족하여 수확할 수 없습니다." });
  }

  const barleyItem = { type: "barley-알곡", count: 1 };
  user.inventory = user.inventory || [];

  const existing = user.inventory.find(i => i.type === barleyItem.type);
  if (existing) existing.count += 1;
  else user.inventory.push(barleyItem);

  user.water -= 3;
  user.fertilizer -= 2;
  await user.save();

  res.status(200).json({ message: "보리 수확 완료", item: barleyItem });
});

app.post("/api/water-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.water <= 0) return res.status(400).send("No water");

  user.water -= 1;
  user.waterGiven = (user.waterGiven || 0) + 1;
  await user.save();
  res.status(200).send();
});

app.post("/api/fertilize-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.fertilizer <= 0) return res.status(400).send("No fertilizer");

  user.fertilizer -= 1;
  user.fertilizerGiven = (user.fertilizerGiven || 0) + 1;
  await user.save();
  res.status(200).send();
});
// 기존 import 및 설정 동일...

app.post("/api/water-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.water <= 0) return res.status(400).send("No water");

  user.water -= 1;
  user.waterGiven = Number(user.waterGiven || 0) + 1; // ✅ 수정: 숫자 보장
  await user.save();
  res.status(200).send();
});

app.post("/api/fertilize-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user || user.fertilizer <= 0) return res.status(400).send("No fertilizer");

  user.fertilizer -= 1;
  user.fertilizerGiven = Number(user.fertilizerGiven || 0) + 1; // ✅ 수정: 숫자 보장
  await user.save();
  res.status(200).send();
});

app.post('/api/buy-seed', async (req, res) => {
  try {
    const { nickname, amount } = req.body;
    if (!nickname || !amount) return res.status(400).json({ success: false, message: '잘못된 요청' });

    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '사용자 없음' });

    const totalCost = Number(amount) * 2;
    if (user.token < totalCost) return res.json({ success: false, message: '토큰 부족' });

    user.token -= totalCost;
    user.seedPotato = Number(user.seedPotato || 0) + Number(amount); // ✅ 수정: 숫자 보장
    await user.save();

    res.json({ success: true, message: '씨감자 구매 완료' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

// 나머지 server.js 전체 내용은 기존과 완전히 동일하게 유지 ✅

app.get("/api/userdata", async (req, res) => {
  const { nickname } = req.query;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    nickname: user.nickname,
    potatoCount: user.potatoCount,
    barleyCount: user.barleyCount,
    water: user.water,
    fertilizer: user.fertilizer,
    token: user.token,
    seedPotato: user.seedPotato, // ✅ 이 줄 추가됨!
    farmName: user.farmName,
    waterGiven: user.waterGiven,
    fertilizerGiven: user.fertilizerGiven
  });
});

mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 완료'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

const farmSchema = new mongoose.Schema({
  nickname: String,
  token: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  inventory: Array,
  seedPotato: { type: Number, default: 0 },
  waterGiven: { type: Number, default: 0 },
  fertilizerGiven: { type: Number, default: 0 }
});

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

app.get('/api/users', async (req, res) => {
  try {
    const users = await Farm.find({}, 'nickname water fertilizer token potatoCount seedPotato');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

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

app.get('/api/market', (req, res) => {
  res.json([
    { name: "감자칩", price: 15 },
    { name: "감자전", price: 20 },
    { name: "감자튀김", price: 30 }
  ]);
});

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

app.post('/api/harvest', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

  const harvested = 5;
  user.potatoCount = (user.potatoCount || 0) + harvested;
  await user.save();

  res.json({ success: true, harvested });
});

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

app.get('/', (req, res) => {
  res.send('✅ OrcaX 감자 서버 정상 작동 중!');
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
