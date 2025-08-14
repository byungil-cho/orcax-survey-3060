// server-unified.js - OrcaX 통합 서버 (감자 + 옥수수 지원)
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// [ADD] normalize: POST /api/corn/buy-additive 에서 item=seeds → seed
app.use('/api/corn/buy-additive', express.json(), (req, res, next) => {
  try {
    if (req.method === 'POST' && req.body && req.body.item === 'seeds') {
      req.body.item = 'seed';
    }
  } catch {}
  next();
});

// ====== 기존 모델/라우터 ======
const User = require('./models/users');

const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  wallet: String,
  amount: Number,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

const MarketProduct = mongoose.models.MarketProduct || mongoose.model('MarketProduct', new mongoose.Schema({
  name: String,
  price: Number,
  amount: Number,
  active: { type: Boolean, default: true },
}));

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

// ====== 미들웨어 ======
const allowOrigins = [
  'https://byungil-cho.github.io',
  'https://byungil-cho.github.io/OrcaX',
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    try {
      const u = new URL(origin);
      const ok = allowOrigins.some(o => origin.startsWith(o))
        || /\.ngrok\.io$/.test(u.hostname)
        || /\.ngrok-?free\.app$/.test(u.hostname)
        || /\.jp\.ngrok\.io$/.test(u.hostname);
      return cb(null, ok);
    } catch {
      return cb(null, false);
    }
  },
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}));
app.options('*', cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== 라우터 장착(기존 그대로) ======
app.use('/api/factory',       factoryRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/user/v2data',   userdataV2Routes);
app.use('/api/seed',          seedRoutes);
app.use('/api/seed',          seedBuyRoutes);
app.use('/api/processing',    processingRoutes);
app.use('/api/marketdata',    marketdataRoutes);
app.use('/api/market',        marketRoutes);
app.use('/api/init-user',     initUserRoutes);
app.use('/api/login',         loginRoutes);
app.use('/api/seed',          seedPriceRoutes);

// ====== Mongo 연결 ======
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

// ====== 세션(감자에서 사용) ======
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl }),
}));

// ====== 헬스 ======
app.get('/api/power-status', (req, res) => {
  res.json({ status: mongoose.connection.readyState === 1 ? "정상" : "오류", mongo: mongoose.connection.readyState === 1 });
});
app.get('/api/ping',   (req, res) => res.status(200).send('pong'));
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ====== 감자/보리 공통 ======
app.post('/api/withdraw', async (req, res) => {
  const { nickname, email, phone, wallet, amount } = req.body || {};
  try {
    if (!nickname || !email || !phone || !wallet || isNaN(amount)) {
      return res.json({ success: false, message: "모든 정보를 입력해 주세요." });
    }
    await Withdraw.create({ name: nickname, email, phone, wallet, amount, createdAt: new Date() });
    res.json({ success: true, message: "출금 신청 완료" });
  } catch {
    res.json({ success: false, message: "출금 신청 실패" });
  }
});

app.post('/api/user/update-token', async (req, res) => {
  const { kakaoId, orcx } = req.body || {};
  if (!kakaoId) return res.json({ success: false, message: '카카오ID 필요' });
  try {
    const user = await User.findOneAndUpdate({ kakaoId }, { orcx: Number(orcx || 0) }, { new: true });
    if (!user) return res.json({ success: false, message: '유저 없음' });
    res.json({ success: true, user });
  } catch {
    res.json({ success: false, message: 'DB 오류' });
  }
});

app.post('/api/withdraw/process', async (req, res) => {
  const { withdrawId, amount } = req.body || {};
  try {
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.json({ success: false, message: "출금 신청 내역 없음" });
    if (withdraw.completed) return res.json({ success: false, message: "이미 완료됨" });
    const user = await User.findOne({ nickname: withdraw.name });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    if ((user.orcx || 0) < Number(amount || 0)) return res.json({ success: false, message: "토큰 부족" });
    user.orcx = (user.orcx || 0) - Number(amount || 0);
    await user.save();
    withdraw.completed = true; await withdraw.save();
    res.json({ success: true });
  } catch {
    res.json({ success: false, message: "서버 오류" });
  }
});

app.get('/api/userdata/all', async (req, res) => {
  try {
    const users = await User.find();
    const list = users.map(u => ({
      nickname: u.nickname,
      kakaoId: u.kakaoId,
      isConnected: true,
      orcx: Number(u.orcx || 0),
      // ⬇⬇⬇ [FIX] ?? + || 혼용 제거 → 전부 ?? 0 (0 유효값 유지)
      water: Number(u.water ?? u.resources?.water ?? u.inventory?.water ?? 0),
      fertilizer: Number(u.fertilizer ?? u.resources?.fertilizer ?? u.inventory?.fertilizer ?? 0),
      potatoCount: Number(u.storage?.gamja ?? u.potato ?? 0),
      barleyCount: Number(u.storage?.bori  ?? u.barley ?? 0),
      seedPotato: Number(u.seedPotato ?? u.seed?.potato ?? u.inventory?.seedPotato ?? 0),
      seedBarley: Number(u.seedBarley ?? u.seed?.barley  ?? u.inventory?.seedBarley ?? 0),
      // ⬆⬆⬆
    }));
    res.json(list);
  } catch {
    res.status(500).json({ error: 'DB 오류' });
  }
});

app.get('/api/withdraw', async (req, res) => {
  try {
    const data = await Withdraw.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch {
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
  } catch {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ====== 감자/보리 프론트 연동 (기존) + 옥수수 값 병합 추가 ======
async function ensureCornDoc(kakaoId) {
  let doc = await (mongoose.models.CornData || mongoose.model('CornData')).findOne({ kakaoId });
  if (!doc) doc = await (mongoose.models.CornData || mongoose.model('CornData')).create({ kakaoId });
  return doc;
}

app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const corn = await ensureCornDoc(kakaoId);

    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        inventory: {
          water: user.water ?? 0,
          fertilizer: user.fertilizer ?? 0,
          seedPotato: user.seedPotato ?? 0,
          seedBarley: user.seedBarley ?? 0
        },
        orcx: user.orcx ?? 0,
        wallet: { orcx: user.orcx ?? 0 },
        potato: user.storage?.gamja ?? 0,
        barley: user.storage?.bori ?? 0,
        growth: user.growth ?? {},
        agri: { corn: corn.corn ?? 0, seedCorn: corn.seeds ?? 0 },
        additives: { salt: corn.additives?.salt ?? 0, sugar: corn.additives?.sugar ?? 0 },
        food: { popcorn: corn.popcorn ?? 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// [ADD] helpers for corn summary
const __n = v => (typeof v === 'number' && Number.isFinite(v)) ? v : Number(v || 0) || 0;
async function __ensureCornDoc(kakaoId) {
  let doc = await (mongoose.models.CornData || mongoose.model('CornData')).findOne({ kakaoId });
  if (!doc) doc = await (mongoose.models.CornData || mongoose.model('CornData')).create({ kakaoId });
  if (!doc.additives) doc.additives = { salt:0, sugar:0 };
  doc.corn = __n(doc.corn); doc.popcorn = __n(doc.popcorn); doc.seeds = __n(doc.seeds);
  return doc;
}

// [ADD] GET /api/corn/summary - 한 번에 옥수수/첨가물/팝콘 + 기본 자원 제공
app.get('/api/corn/summary', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId || req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const UserModel = mongoose.models.users || mongoose.model('users');
    const user = await UserModel.findOne({ kakaoId });
    const corn = await __ensureCornDoc(kakaoId);
    return res.json({
      ok: true,
      wallet: { orcx: __n(user?.orcx) },
      inventory: { water: __n(user?.water), fertilizer: __n(user?.fertilizer) },
      agri: { corn: __n(corn.corn), seeds: __n(corn.seeds) },
      additives: { salt: __n(corn.additives?.salt), sugar: __n(corn.additives?.sugar) },
      food: { popcorn: __n(corn.popcorn) }
    });
  } catch (e) {
    res.status(500).json({ ok:false, error:'server error' });
  }
});

// [ADD] GET /api/userdata - 구버전 호환 (kakaoId 또는 nickname)
app.get('/api/userdata', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId || req.body?.kakaoId || null;
    const nickname = req.query.nickname || req.body?.nickname || null;
    const UserModel = mongoose.models.users || mongoose.model('users');
    let user = null;
    if (kakaoId) user = await UserModel.findOne({ kakaoId });
    else if (nickname) user = await UserModel.findOne({ nickname });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    const corn = await __ensureCornDoc(user.kakaoId || kakaoId);
    const potato = __n(user.storage?.gamja ?? user.potato);
    const barley = __n(user.storage?.bori  ?? user.barley);
    return res.json({
      success: true,
      user: {
        nickname: user.nickname,
        orcx: __n(user.orcx),
        inventory: {
          water: __n(user.water ?? user.resources?.water ?? user.inventory?.water),
          fertilizer: __n(user.fertilizer ?? user.resources?.fertilizer ?? user.inventory?.fertilizer),
          seedPotato: __n(user.seedPotato ?? user.seed?.potato ?? user.inventory?.seedPotato),
          seedBarley: __n(user.seedBarley ?? user.seed?.barley ?? user.inventory?.seedBarley)
        },
        potato, barley,
        agri: { corn: __n(corn.corn), seedCorn: __n(corn.seeds) },
        additives: { salt: __n(corn.additives?.salt), sugar: __n(corn.additives?.sugar) },
        food: { popcorn: __n(corn.popcorn) }
      }
    });
  } catch (e) {
    res.status(500).json({ success:false, message:'server error' });
  }
});

// ====== v2data(기존) ======
app.post('/api/user/v2data', async (req, res) => {
  const { kakaoId } = req.body || {};
  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      user: {
        orcx: Number(user.orcx || 0),
        seedPotato: Number(user.seedPotato || 0),
        seedBarley: Number(user.seedBarley || 0)
      }
    });
  } catch {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ====== 가격 전광판 ======
async function getPriceboard() {
  const doc = await (mongoose.models.CornSettings || mongoose.model('CornSettings')).findOne();
  return (doc?.priceboard) || { salt: 10, sugar: 20, seed: 30, currency: 'ORCX' };
}
async function setPriceboard(update) {
  let doc = await (mongoose.models.CornSettings || mongoose.model('CornSettings')).findOne();
  if (!doc) doc = await (mongoose.models.CornSettings || mongoose.model('CornSettings')).create({});
  const cur = (doc.priceboard?.toObject?.() || doc.priceboard || {});
  doc.priceboard = { ...cur, ...update };
  await doc.save();
  return doc.priceboard;
}

app.get('/api/corn/priceboard', async (req, res) => {
  try {
    res.json(await getPriceboard());
  } catch {
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
    if ((user.orcx || 0) < total) return res.status(400).json({ error: '토큰 부족' });

    user.orcx = (user.orcx || 0) - total;
    const CornData = mongoose.models.CornData || mongoose.model('CornData');
    let corn = await CornData.findOne({ kakaoId });
    if (!corn) corn = await CornData.create({ kakaoId });
    if (!corn.additives) corn.additives = { salt:0, sugar:0 };

    if (item === 'salt') corn.additives.salt = (corn.additives.salt || 0) + q;
    if (item === 'sugar') corn.additives.sugar = (corn.additives.sugar || 0) + q;
    if (item === 'seed')  corn.seeds = (corn.seeds || 0) + q;

    await user.save(); await corn.save();
    res.json({
      wallet: { orcx: user.orcx || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 },
      agri: { seed: corn.seeds || 0 }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });

    const CornData = mongoose.models.CornData || mongoose.model('CornData');
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });
    if ((corn.seeds || 0) < 1) return res.status(400).json({ error: '씨앗 부족' });
    corn.seeds = (corn.seeds || 0) - 1;
    await corn.save();

    res.json({ ok: true, agri: { seed: corn.seeds || 0 } });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'কkakaoId 필요' });

    const CornData = mongoose.models.CornData || mongoose.model('CornData');
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });
    const gain = 5 + Math.floor(Math.random() * 4); // 5~8
    corn.corn = (corn.corn || 0) + gain;
    await corn.save();

    res.json({ gain, agri: { corn: corn.corn || 0 } });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/pop', async (req, res) => {
  try {
    const { kakaoId, use } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const CornData = mongoose.models.CornData || mongoose.model('CornData');
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });
    if ((corn.corn || 0) < 1) return res.status(400).json({ error: '옥수수 부족' });

    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if ((corn.additives?.[pick] || 0) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if ((corn.additives?.[other] || 0) < 1) return res.status(400).json({ error: '첨가물 부족' });
      pick = other;
    }

    corn.corn = (corn.corn || 0) - 1;
    corn.additives[pick] = (corn.additives[pick] || 0) - 1;

    const POP_RATE = 0.6;
    const TOKEN_DROP = [1,2,3,5];
    const POP_DROP = [1,2];
    const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

    let result, qty;
    if (Math.random() < POP_RATE) {
      qty = rnd(POP_DROP);
      corn.popcorn = (corn.popcorn || 0) + qty;
      user.products = user.products || {};
      user.products.popcorn = (user.products.popcorn || 0) + qty;
      result = 'popcorn';
    } else {
      qty = rnd(TOKEN_DROP);
      user.orcx = (user.orcx || 0) + qty;
      result = 'token';
    }

    await user.save(); await corn.save();

    res.json({
      result, qty,
      wallet: { orcx: user.orcx || 0 },
      food: { popcorn: corn.popcorn || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 },
      agri: { corn: corn.corn || 0 }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// [ADD] POST /api/corn/exchange - 팝콘 ↔ 비료 1:1 교환
app.post('/api/corn/exchange', async (req, res) => {
  try {
    const { kakaoId, qty: rawQty, dir } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId required' });
    const qty = Math.max(1, Number(rawQty || 1));
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const CornData = mongoose.models.CornData || mongoose.model('CornData');
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });

    if (dir === 'fertilizer->popcorn') {
      if ((user.fertilizer || 0) < qty) return res.status(400).json({ error: 'no fertilizer' });
      user.fertilizer = (user.fertilizer || 0) - qty;
      corn.popcorn = (corn.popcorn || 0) + qty;
    } else {
      if ((corn.popcorn || 0) < qty) return res.status(400).json({ error: 'no popcorn' });
      corn.popcorn = (corn.popcorn || 0) - qty;
      user.fertilizer = (user.fertilizer || 0) + qty;
    }
    await Promise.all([user.save(), corn.save()]);
    res.json({ ok: true, user: { fertilizer: user.fertilizer || 0 }, corn: { popcorn: corn.popcorn || 0 } });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// ====== 서버 시작 ======
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
