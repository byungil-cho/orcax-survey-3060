// ✅ OrcaX Backend 통합 서버
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3060;
// ✅ 라우터 연결
const farmRoutes = require('./routes/farm');
const barleyRoutes = require('./routes/barley');
const productRoutes = require('./routes/products');
const userdataRoute = require('./routes/userdata');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products'); // 유지
const userDataRoutes = require('./routes/api-userdata-and-products'); // ✅ 이름 다르게 선언

// ✅ 모델
const Farm = require('./models/Farm');
// ✅ 기본 미들웨어
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ API 라우팅
app.use('/api/farm', farmRoutes);
app.use('/api', barleyRoutes);
app.use('/api/products', productRoutes);
app.use('/api', userdataRoute);
app.use('/api', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api', userDataRoutes);

// ✅ 상태 체크
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
// ✅ 보리 수확/급수/비료
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
// ✅ 사용자 정보 저장/조회
app.post('/api/userdata', async (req, res) => {
  try {
    const {
      nickname, token, water, fertilizer,
      potatoCount, seedPotato, inventory, barleyCount
    } = req.body;

    const updated = await Farm.findOneAndUpdate(
      { nickname },
      { token, water, fertilizer, potatoCount, seedPotato, inventory, barleyCount },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "업데이트 실패" });
  }
});
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
    seedPotato: user.seedPotato,
    farmName: user.farmName,
    waterGiven: user.waterGiven,
    fertilizerGiven: user.fertilizerGiven
  });
});
// ✅ 기타 기능 API들 (시세, 판매 등)
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
// ✅ 씨감자 관련
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
// ✅ 기타 유틸 API
app.get('/api/storage/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  try {
    const user = await Farm.findOne({ nickname });
    if (!user) return res.json([]);
    res.json(user.inventory || []);
  } catch (err) {
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
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
app.post('/api/products/:nickname', async (req, res) => {
  const nickname = decodeURIComponent(req.params.nickname);
  const products = req.body;

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: '배열이 아님' });
  }

  try {
    await db.collection('products').deleteMany({ nickname });

    const cleanProducts = products
      .filter(p => typeof p.type === 'string' && typeof p.category === 'string')
      .map(p => ({ nickname, type: p.type, category: p.category, count: p.count || 0 }));

    if (cleanProducts.length > 0) {
      await db.collection('products').insertMany(cleanProducts);
    }

    res.status(200).json({ message: '저장됨' });
  } catch (err) {
    console.error('저장 실패:', err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ 루트 진입
app.get('/', (req, res) => {
  res.send('✅ OrcaX 감자 서버 정상 작동 중!');
});
// ✅ Mongo 연결 및 서버 시작
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB 연결됨'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
