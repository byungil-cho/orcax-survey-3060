// server-unified.js - OrcaX 통합 서버 (감자 + 옥수수 지원)
require('dotenv').config();

const express = require('express');
const app = express();

let db; // set after mongoose connection opens
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// ====== 기존 모델/라우터 ======
const User = require('./models/users');

const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', new mongoose.Schema({
  kakaoId: { type: String, index: true },
  nickname: String,
  wallet: String,
  phone: String,
  requested: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'withdraws' }));

const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId: { type: String, index: true },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  seed: { type: Number, default: 0 }
}, { collection: 'corn_data' }));

const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', new mongoose.Schema({
  currency: { type: String, default: 'ORCX' },
  salt: { type: Number, default: 10 },
  sugar: { type: Number, default: 20 },
  seed: { type: Number, default: 30 }
}, { collection: 'corn_settings' }));

// ====== 미들웨어 ======
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====== 라우터 임포트 ======
const factoryRoutes = require('./routes/factory');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userdataV2Routes = require('./routes/userdata_v2');
const seedRoutes = require('./routes/seed-status');
const seedBuyRoutes = require('./routes/seed');
const initUserRoutes = require('./routes/init-user');
const loginRoutes = require('./routes/login');
const processingRoutes = require('./routes/processing');
const marketdataRoutes = require('./routes/marketdata');
const marketRoutes = require('./routes/marketdata');
const seedPriceRoutes = require('./routes/seed-price');
// ⚠️ 변경) corn 라우터는 DB 연결 이후 장착

// ====== 라우터 장착(기존) ======
app.use('/api/factory', factoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user/v2data', userdataV2Routes);
app.use('/api/seed', seedRoutes);
app.use('/api/seed', seedBuyRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/marketdata', marketdataRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/init-user', initUserRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/seed', seedPriceRoutes);
// (⚠️ 변경) 여기서 corn 라우터를 장착하지 않음

// ====== Mongo 연결 ======
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

mongoose.connection.once('open', () => {
  db = mongoose.connection.db;                           // native db 핸들
  const cornRouter = require('./routes/corn')(db);       // 이제 db 주입
  app.use('/api/corn', cornRouter);                      // 장착
  console.log('🌽 /api/corn 라우터 장착 완료');
});

// ====== 세션 (감자에서 사용) ======
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl }),
}));

// ====== 공통/헬스 ======
app.get('/api/power-status', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.json({ status: mongoReady ? "정상" : "오류", mongo: mongoReady });
});

// [GLOBAL] CornTrade model: logs popcorn↔fertilizer exchanges
const CornTrade = mongoose.models.CornTrade || mongoose.model('CornTrade', new mongoose.Schema({
  kakaoId: { type: String, index: true },
  type: { type: String, default: 'popcorn->fertilizer' },
  qty: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'corn_trades' }));

// ====== 유틸 ======
function n(v) { return (typeof v === 'number' && Number.isFinite(v)) ? v : 0; }
async function getPriceboard() {
  let pb = await CornSettings.findOne({});
  if (!pb) pb = await CornSettings.create({});
  return { currency: pb.currency, salt: pb.salt, sugar: pb.sugar, seed: pb.seed };
}
async function setPriceboard(next) {
  const pb = await CornSettings.findOne({});
  if (!pb) return await CornSettings.create(next);
  Object.assign(pb, next); await pb.save(); return pb;
}

// ====== 출금 요청 조회(예시) ======
app.get('/api/withdraws', async (req, res) => {
  try {
    const data = await Withdraw.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/user/profile/:nickname', async (req, res) => {
  const { nickname } = req.params;
  if (!nickname) return res.status(400).json({ error: "닉네임 필요" });
  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "유저 없음" });
    res.json({
      nickname: user.nickname,
      kakaoId: user.kakaoId,
      farmName: user.farmName,
      level: user.level || 1,
      grade: user.grade || "초급",
      orcx: user.orcx || 0,
      water: user.water || 0,
      fertilizer: user.fertilizer || 0,
      seedPotato: user.seedPotato || 0,
      seedBarley: user.seedBarley || 0,
      potato: user.storage?.gamja || 0,
      barley: user.storage?.bori || 0,
      products: user.products || {},
      lastLogin: user.lastLogin,
    });
  } catch (e) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ====== 로그인(기존) ======
app.post('/api/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.json({ success: false, message: "kakaoId/nickname 필수" });

  let user = await User.findOne({ kakaoId });
  if (!user) {
    user = await User.create({
      kakaoId, nickname,
      orcx: 10, water: 10, fertilizer: 10,
      seedPotato: 0, seedBarley: 0,
      storage: { gamja: 0, bori: 0 },
      growth: { potato: 0, barley: 0 },
      products: {},
    });
  } else {
    if (!user.kakaoId) user.kakaoId = kakaoId;
    if (!user.nickname) user.nickname = nickname;
    await user.save();
  }
  res.json({ success: true, user: { kakaoId: user.kakaoId, nickname: user.nickname } });
});

// ====== 가격 전광판 ======
app.get('/api/corn/priceboard', async (req, res) => {
  try {
    res.json(await getPriceboard());
  } catch (e) {
    res.status(500).json({ salt: 10, sugar: 20, seed: 30, currency: 'ORCX' });
  }
});

app.patch('/api/corn/priceboard', async (req, res) => {
  try {
    const { salt, sugar, seed, currency } = req.body || {};
    const next = {};
    if (Number.isFinite(salt))  next.salt  = Number(salt);
    if (Number.isFinite(sugar)) next.sugar = Number(sugar);
    if (Number.isFinite(seed))  next.seed  = Number(seed);
    if (currency)               next.currency = String(currency);
    const pb = await setPriceboard(next);
    res.json(pb);
  } catch (e) {
    res.status(500).json(await getPriceboard());
  }
});

// ====== (신규) 옥수수: 구매/심기/수확/뻥튀기 ======
app.post('/api/corn/buy-additive', async (req, res) => {
  try {
    const { kakaoId, item, qty } = req.body || {};
    const q = Math.max(1, Number(qty || 1));
    if (!kakaoId || !['salt','sugar','seed'].includes(item)) {
      return res.status(400).json({ error: 'kakaoId, item(salt|sugar|seed) 필요' });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: '유저 없음' });

    const pb = await getPriceboard();
    const price = item === 'salt' ? pb.salt : item === 'sugar' ? pb.sugar : pb.seed;
    const total = q * price;
    if (n(user.orcx) < total) return res.status(400).json({ error: '토큰 부족' });

    // 차감/증가
    user.orcx = (user.orcx || 0) - total;
    let corn = await CornData.findOne({ kakaoId });
    if (!corn) corn = await CornData.create({ kakaoId });
    if (!corn.additives) corn.additives = { salt:0, sugar:0 };

    if (item === 'salt') corn.additives.salt = (corn.additives.salt || 0) + q;
    if (item === 'sugar') corn.additives.sugar = (corn.additives.sugar || 0) + q;
    if (item === 'seed')  corn.seed = (corn.seed || 0) + q;

    await user.save(); await corn.save();
    res.json({
      wallet: { orcx: user.orcx || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 },
      agri: { seed: corn.seed || 0 }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// [ADD] 팝콘 ↔ 거름 1:1 교환 (기본: popcorn -> fertilizer)
app.post('/api/corn/exchange', async (req, res) => {
  try {
    const { kakaoId, qty: rawQty, dir } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId required' });
    const qty = Math.max(1, Number(rawQty || 1));

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const corn = await CornData.findOne({ kakaoId });
    if (!corn) return res.status(404).json({ error: 'corn not found' });

    // 기본 경로: 팝콘 -> 거름
    if (dir === 'fertilizer->popcorn') {
      if (n(user.fertilizer) < qty) return res.status(400).json({ error: 'no fertilizer' });
      user.fertilizer = (user.fertilizer || 0) - qty;
      corn.popcorn = (corn.popcorn || 0) + qty;
      await CornTrade.create({ kakaoId, type: 'fertilizer->popcorn', qty });
    } else {
      if (n(corn.popcorn) < qty) return res.status(400).json({ error: 'no popcorn' });
      corn.popcorn = (corn.popcorn || 0) - qty;
      user.fertilizer = (user.fertilizer || 0) + qty;
      await CornTrade.create({ kakaoId, type: 'popcorn->fertilizer', qty });
    }

    await Promise.all([user.save(), corn.save()]);
    res.json({
      ok: true,
      user: { fertilizer: user.fertilizer || 0 },
      corn: { popcorn: corn.popcorn || 0 }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// (이하 기존 감자/보리/시장 등 라우트들 그대로 유지)

// ====== 서버 시작 ======
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => {
  console.log(`🚀 Unified server listening on ${PORT}`);
});
