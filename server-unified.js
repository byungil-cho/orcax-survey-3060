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

// ====== 기존 모델/라우터 ======
const User = require('./models/users');
const CornData = require('./models/CornData'); // ✅ 분리 모델 로드

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
const cornRoutes = require('./routes/corn'); // ✅ 신규 라우터

const buyRoutes = require('./buy-routes');
buyRoutes(app, { getUser, saveUser });

// ✅ (문제였던 스키마 조각 제거됨)

// ====== 옥수수 가격 설정 모델 ======
const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', new mongoose.Schema({
  priceboard: {
    salt:     { type: Number, default: 10 },
    sugar:    { type: Number, default: 20 },
    seed:     { type: Number, default: 30 },
    currency: { type: String, default: 'ORCX' }
  }
}, { collection: 'corn_settings' }));

// ====== 공통 미들웨어 ======

// CORS (GitHub Pages + ngrok HTTPS 허용)
const allowOrigins = [
  'https://byungil-cho.github.io',
  'https://byungil-cho.github.io/OrcaX',
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin(origin, cb){
    if (!origin) return cb(null, true);
    try {
      const u = new URL(origin);
      const ok = allowOrigins.some(o => origin.startsWith(o))
        || /\.ngrok\.io$/.test(u.hostname)
        || /\.ngrok-?free\.app$/.test(u.hostname);
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

// ====== 라우터 장착(기존 + 신규) ======
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
app.use('/api/corn', cornRoutes); // ✅

/* ====== Mongo 연결 ====== */
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

/* ====== 세션 ====== */
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl }),
}));

/* ====== 공통/헬스 ====== */
app.get('/api/power-status', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.json({ status: mongoReady ? "정상" : "오류", mongo: mongoReady });
});
app.get('/api/ping', (req, res) => res.status(200).send('pong'));
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

/* ====== 감자/보리 프론트 연동 (기존) + 옥수수 병합 ====== */
async function ensureCornDoc(kakaoId) {
  let doc = await CornData.findOne({ kakaoId });
  if (!doc) doc = await CornData.create({ kakaoId });
  if (!doc.phase) doc.phase = 'IDLE';
  if (typeof doc.g !== 'number') doc.g = 0;
  if (!doc.additives) doc.additives = { salt:0, sugar:0 };
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

/* ====== (신규) 재고(물/거름) 차감 ====== */
app.post('/api/user/inventory/use', async (req, res) => {
  try {
    const { kakaoId, type, amount } = req.body || {};
    const amt = Math.max(1, Number(amount || 1));
    if (!kakaoId || !['water','fertilizer'].includes(type)) {
      return res.status(400).json({ error:'kakaoId, type(water|fertilizer) 필요' });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'User not found' });

    const curWater = Number(user.water ?? 0);
    const curFerti = Number(user.fertilizer ?? 0);
    const cur = (type === 'water') ? curWater : curFerti;

    if (cur < amt) {
      return res.status(400).json({
        error:'재고 부족',
        inventory: { water: curWater, fertilizer: curFerti }
      });
    }

    if (type === 'water') user.water = curWater - amt;
    else user.fertilizer = curFerti - amt;
    await user.save();

    return res.json({
      ok:true,
      inventory: { water: Number(user.water ?? 0), fertilizer: Number(user.fertilizer ?? 0) }
    });
  } catch (e) {
    res.status(500).json({ error:'server error' });
  }
});

/* ====== v2data (기존) ====== */
app.post('/api/user/v2data', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      user: {
        orcx: user.orcx ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

/* ====== 로그인(기존) + 옥수수 도큐먼트 생성 보장 ====== */
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
  await ensureCornDoc(kakaoId);
  res.json({ success: true, user });
});

/* ====== 관리자/마켓(기존) ====== */
app.get('/api/admin/all-products-quantities', async (req, res) => {
  try {
    const users = await User.find({});
    const totals = {};
    users.forEach(user => {
      if (!user.products) return;
      for (const [name, qty] of Object.entries(user.products)) {
        if (!totals[name]) totals[name] = 0;
        totals[name] += qty;
      }
    });
    res.json(Object.entries(totals).map(([name, total]) => ({ name, total })));
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/marketdata/products', async (req, res) => {
  try {
    const products = await MarketProduct.find({});
    res.json(products);
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/market/price-board', async (req, res) => {
  try {
    const products = await MarketProduct.find({ active: true, amount: { $gt: 0 } });
    res.json({
      success: true,
      priceList: products.map(x => ({ name: x.name, price: x.price, amount: x.amount, active: x.active }))
    });
  } catch (e) {
    res.json({ success: false, priceList: [] });
  }
});

app.post('/api/marketdata/products/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "배열 필요" });
    const results = [];
    for (const { name, price, amount } of items.slice(0, 5)) {
      if (!name || !price || !amount) continue;
      const found = await MarketProduct.findOne({ name });
      if (found) {
        found.price = price; found.amount = amount; found.active = true; await found.save();
        results.push(found);
      } else {
        results.push(await MarketProduct.create({ name, price, amount, active: true }));
      }
    }
    res.json({ success: true, results });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.put('/api/marketdata/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const prod = await MarketProduct.findByIdAndUpdate(id, update, { new: true });
    res.json(prod);
  } catch (e) { res.status(500).json({}); }
});

app.delete('/api/marketdata/products/:id', async (req, res) => {
  try {
    await MarketProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false }); }
});

/* ====== 옥수수: 가격보드 ====== */
async function getPriceboard() {
  const doc = await CornSettings.findOne();
  return (doc?.priceboard) || { salt: 10, sugar: 20, seed: 30, currency: 'ORCX' };
}
async function setPriceboard(update) {
  let doc = await CornSettings.findOne();
  if (!doc) doc = await CornSettings.create({});
  doc.priceboard = { ...doc.priceboard.toObject?.() || doc.priceboard || {}, ...update };
  await doc.save();
  return doc.priceboard;
}
app.get('/api/corn/priceboard', async (req, res) => {
  try { res.json(await getPriceboard()); }
  catch { res.status(500).json({ salt:10, sugar:20, seed:30, currency:'ORCX' }); }
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
  } catch { res.status(500).json(await getPriceboard()); }
});

/* ====== 옥수수: 구매/심기/수확/뻥튀기 ====== */
app.post('/api/corn/buy-additive', async (req, res) => {
  try {
    const { kakaoId, item, qty } = req.body || {};
    const q = Math.max(1, Number(qty || 1));
    if (!kakaoId || !['salt','sugar','seed'].includes(item)) {
      return res.status(400).json({ error: 'kakaoId, item(salt|sugar|seed) 필요' });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const price = await getPriceboard();
    const unit  = item === 'salt' ? price.salt : item === 'sugar' ? price.sugar : price.seed;
    const need  = unit * q;
    if ((user.orcx || 0) < need) return res.status(400).json({ error: '토큰 부족' });

    const corn = await ensureCornDoc(kakaoId);
    user.orcx = (user.orcx || 0) - need;

    if (item === 'seed') {
      corn.seeds = (corn.seeds || 0) + q;
      await user.save(); await corn.save();
      return res.json({ wallet:{ orcx:user.orcx||0 }, seeds: corn.seeds||0 });
    } else {
      corn.additives[item] = (corn.additives[item] || 0) + q;
      await user.save(); await corn.save();
      return res.json({
        wallet:{ orcx:user.orcx||0 },
        additives:{ salt: corn.additives.salt||0, sugar: corn.additives.sugar||0 }
      });
    }
  } catch { res.status(500).json({ error: 'server error' }); }
});

app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    if ((corn.seeds || 0) < 1) return res.status(400).json({ error: '씨앗 부족' });
    corn.seeds = (corn.seeds || 0) - 1;
    corn.phase = 'GROW'; corn.g = 0; corn.plantedAt = new Date();
    await corn.save();
    res.json({ ok:true, seeds: corn.seeds||0, phase: corn.phase, g: corn.g, plantedAt: corn.plantedAt });
  } catch { res.status(500).json({ error: 'server error' }); }
});

app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    const gain = 5 + Math.floor(Math.random() * 4);
    corn.corn = (corn.corn || 0) + gain;
    corn.phase = 'STUBBLE'; corn.g = 0;
    await corn.save();
    res.json({ gain, agri:{ corn: corn.corn||0 }, phase: corn.phase, g: corn.g });
  } catch { res.status(500).json({ error: 'server error' }); }
});

app.post('/api/corn/pop', async (req, res) => {
  try {
    const { kakaoId, use } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const corn = await ensureCornDoc(kakaoId);
    if ((corn.corn || 0) < 1) return res.status(400).json({ error: '옥수수 부족' });

    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if ((corn.additives[pick] || 0) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if ((corn.additives[other] || 0) < 1) return res.status(400).json({ error: '첨가물 부족' });
      pick = other;
    }

    corn.corn -= 1; corn.additives[pick] -= 1;

    const POP_RATE = 0.6;
    const TOKEN_DROP = [1,2,3,5];
    const POP_DROP   = [1,2];
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
      wallet:{ orcx: user.orcx||0 },
      food:{ popcorn: corn.popcorn||0 },
      additives:{ salt: corn.additives.salt||0, sugar: corn.additives.sugar||0 },
      agri:{ corn: corn.corn||0 }
    });
  } catch { res.status(500).json({ error: 'server error' }); }
});

/* ====== 보조 API: 요약/교환/성장 ====== */
app.get('/api/corn/summary', async (req, res) => {
  try {
    const kakaoId = (req.query && req.query.kakaoId) || (req.body && req.body.kakaoId);
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ ok:false, error:'User not found' });
    const corn = await ensureCornDoc(kakaoId);
    res.json({
      ok:true,
      wallet:{ orcx: user.orcx||0 },
      inventory:{ water: user.water||0, fertilizer: user.fertilizer||0 },
      agri:{ corn: corn.corn||0, seeds: corn.seeds||0 },
      additives:{ salt: corn.additives.salt||0, sugar: corn.additives.sugar||0 },
      food:{ popcorn: corn.popcorn||0 },
      phase: corn.phase || 'IDLE',
      g: corn.g || 0,
      plantedAt: corn.plantedAt || null
    });
  } catch { res.status(500).json({ ok:false, error:'server error' }); }
});

app.post('/api/corn/exchange', async (req, res) => {
  try {
    const body = req.body || {};
    const kakaoId = body.kakaoId;
    if (!kakaoId) return res.status(400).json({ error:'kakaoId required' });
    const qty = Math.max(1, Number(body.qty || 1));
    const dir = body.dir;

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'user not found' });

    const corn = await ensureCornDoc(kakaoId);

    if (dir === 'fertilizer->popcorn') {
      if ((user.fertilizer||0) < qty) return res.status(400).json({ error:'no fertilizer' });
      user.fertilizer = (user.fertilizer||0) - qty;
      corn.popcorn   = (corn.popcorn||0)    + qty;
    } else {
      if ((corn.popcorn||0) < qty) return res.status(400).json({ error:'no popcorn' });
      corn.popcorn   = (corn.popcorn||0)    - qty;
      user.fertilizer = (user.fertilizer||0) + qty;
    }
    await Promise.all([ user.save(), corn.save() ]);
    res.json({ ok:true, user:{ fertilizer:user.fertilizer||0 }, corn:{ popcorn:corn.popcorn||0 } });
  } catch { res.status(500).json({ error:'server error' }); }
});

app.post('/api/corn/grow', async (req, res) => {
  try {
    const { kakaoId, step } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const inc = Math.max(1, Number(step || 5));
    const corn = await ensureCornDoc(kakaoId);
    if ((corn.phase || 'IDLE') !== 'GROW') return res.status(400).json({ ok:false, error:'not growing' });
    corn.g = Math.min(100, Number(corn.g || 0) + inc);
    await corn.save();
    res.json({ ok:true, phase: corn.phase, g: corn.g });
  } catch { res.status(500).json({ ok:false, error:'server error' }); }
});

/* ====== 서버 시작 포트 ====== */
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
