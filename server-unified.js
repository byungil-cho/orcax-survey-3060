// server-unified.js - OrcaX 통합 서버 (감자/보리 + 옥수수)
// 변경 요약:
// 1) /api/userdata 완전 통합: 과거/현재 모든 경로(water/fertilizer/potato/barley/seed*, storage, inventory, resources 등) 흡수
// 2) Corn(옥수수) 정보도 /api/userdata에 병합(popcorn/salt/sugar/seedCorn/corn)
// 3) null-safe 숫자 보정(n()), ensureCornDoc()로 도큐먼트 보장
// 4) CORS/세션/헬스/마켓/관리 API는 기존 유지, 포트 3060

require('dotenv').config();

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// ====== 공통 유틸 ======
const n = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v : Number(v || 0) || 0;

// ====== 모델 ======
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

// 옥수수 데이터
const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId: { type: String, index: true, unique: true },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  seeds: { type: Number, default: 0 }
}, { collection: 'corn_data' }));

// 옥수수 가격 전광판
const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', new mongoose.Schema({
  priceboard: {
    salt:     { type: Number, default: 10 },
    sugar:    { type: Number, default: 20 },
    seed:     { type: Number, default: 30 },
    currency: { type: String, default: 'ORCX' }
  }
}, { collection: 'corn_settings' }));

// 팝콘<->비료 교환 로그(선택)
const CornTrade = mongoose.models.CornTrade || mongoose.model('CornTrade', new mongoose.Schema({
  kakaoId: { type: String, index: true },
  type: { type: String, default: 'popcorn->fertilizer' },
  qty: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'corn_trades' }));

// ====== 외부 라우터(기존) ======
const factoryRoutes     = require('./routes/factory');
const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/user');
const userdataV2Routes  = require('./routes/userdata_v2');
const seedRoutes        = require('./routes/seed-status');
const seedBuyRoutes     = require('./routes/seed');
const initUserRoutes    = require('./routes/init-user');
const loginRoutes       = require('./routes/login');
const processingRoutes  = require('./routes/processing');
const marketdataRoutes  = require('./routes/marketdata');
const marketRoutes      = require('./routes/marketdata');
const seedPriceRoutes   = require('./routes/seed-price');

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
    if (n(user.orcx) < n(amount)) return res.json({ success: false, message: "토큰 부족" });
    user.orcx = n(user.orcx) - n(amount);
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
      orcx: n(u.orcx),
      water: n(u.water ?? u.resources?.water ?? u.inventory?.water),
      fertilizer: n(u.fertilizer ?? u.resources?.fertilizer ?? u.inventory?.fertilizer),
      potatoCount: n(u.storage?.gamja ?? u.potato),
      barleyCount: n(u.storage?.bori  ?? u.barley),
      seedPotato: n(u.seedPotato ?? u.seed?.potato ?? u.inventory?.seedPotato),
      seedBarley: n(u.seedBarley ?? u.seed?.barley  ?? u.inventory?.seedBarley),
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
      orcx: n(user.orcx),
      water: n(user.water),
      fertilizer: n(user.fertilizer),
      seedPotato: n(user.seedPotato),
      seedBarley: n(user.seedBarley),
      potato: n(user.storage?.gamja),
      barley: n(user.storage?.bori),
      products: user.products || {},
      lastLogin: user.lastLogin,
    });
  } catch {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ====== Corn 공통 유틸 ======
async function ensureCornDoc(kakaoId) {
  let doc = await CornData.findOne({ kakaoId });
  if (!doc) doc = await CornData.create({ kakaoId });
  // 필드 안전 보정
  doc.additives = doc.additives || { salt:0, sugar:0 };
  doc.seeds = n(doc.seeds);
  doc.corn = n(doc.corn);
  doc.popcorn = n(doc.popcorn);
  return doc;
}

async function getPriceboard() {
  const doc = await CornSettings.findOne();
  return (doc?.priceboard) || { salt: 10, sugar: 20, seed: 30, currency: 'ORCX' };
}
async function setPriceboard(update) {
  let doc = await CornSettings.findOne();
  if (!doc) doc = await CornSettings.create({});
  const cur = (doc.priceboard?.toObject?.() || doc.priceboard || {});
  doc.priceboard = { ...cur, ...update };
  await doc.save();
  return doc.priceboard;
}

// ====== [핵심] 구버전 호환 /api/userdata (모든 경로 흡수 + 옥수수 병합) ======
app.all('/api/userdata', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId || req.body?.kakaoId || null;
    const nickname = req.query.nickname || req.body?.nickname || null;

    let user = null;
    if (kakaoId) user = await User.findOne({ kakaoId });
    else if (nickname) user = await User.findOne({ nickname });

    // 유저 없을 때도 구조 유지
    if (!user) {
      const corn = kakaoId ? await ensureCornDoc(kakaoId).catch(() => null) : null;
      return res.json({
        success: true,
        kakaoId: kakaoId || null,
        nickname: nickname || null,
        orcx: 0,
        water: 0,
        fertilizer: 0,
        potato: 0,
        barley: 0,
        seedPotato: 0,
        seedBarley: 0,
        // 옥수수
        agri: { corn: n(corn?.corn), seedCorn: n(corn?.seeds) },
        additives: { salt: n(corn?.additives?.salt), sugar: n(corn?.additives?.sugar) },
        food: { popcorn: n(corn?.popcorn) },
        // 레거시 호환
        storage: { gamja: 0, bori: 0 },
        user: { orcx: 0, water: 0, fertilizer: 0, seedPotato: 0, seedBarley: 0, storage: { gamja: 0, bori: 0 } }
      });
    }

    const potato  = n(user.storage?.gamja ?? user.potato);
    const barley  = n(user.storage?.bori  ?? user.barley);
    const water   = n(user.water ?? user.resources?.water ?? user.inventory?.water);
    const ferti   = n(user.fertilizer ?? user.resources?.fertilizer ?? user.inventory?.fertilizer);
    const sPotato = n(user.seedPotato ?? user.seed?.potato ?? user.inventory?.seedPotato);
    const sBarley = n(user.seedBarley ?? user.seed?.barley  ?? user.inventory?.seedBarley);
    const orcx    = n(user.orcx);

    const corn = await ensureCornDoc(user.kakaoId || kakaoId || '');

    return res.json({
      success: true,
      kakaoId: user.kakaoId ?? kakaoId ?? null,
      nickname: user.nickname ?? nickname ?? null,
      orcx, water, fertilizer: ferti,
      potato, barley,
      seedPotato: sPotato, seedBarley: sBarley,
      // 옥수수 병합
      agri: { corn: n(corn?.corn), seedCorn: n(corn?.seeds) },
      additives: { salt: n(corn?.additives?.salt), sugar: n(corn?.additives?.sugar) },
      food: { popcorn: n(corn?.popcorn) },
      // 레거시 호환 키 그대로 포함
      storage: { gamja: potato, bori: barley },
      user: {
        kakaoId: user.kakaoId ?? null,
        nickname: user.nickname ?? null,
        orcx, water, fertilizer: ferti,
        seedPotato: sPotato, seedBarley: sBarley,
        storage: { gamja: potato, bori: barley }
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// ====== 재고(물/거름) 차감(안전) ======
app.post('/api/user/inventory/use', async (req, res) => {
  try {
    const { kakaoId, type, amount } = req.body || {};
    const amt = Math.max(1, Number(amount || 1));
    if (!kakaoId || !['water','fertilizer'].includes(type)) {
      return res.status(400).json({ error:'kakaoId, type(water|fertilizer) 필요' });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'User not found' });

    const curWater = n(user.water);
    const curFerti = n(user.fertilizer);
    const cur = (type === 'water') ? curWater : curFerti;
    if (cur < amt) {
      return res.status(400).json({ error:'재고 부족', inventory: { water: curWater, fertilizer: curFerti } });
    }
    if (type === 'water') user.water = curWater - amt;
    else user.fertilizer = curFerti - amt;
    await user.save();

    return res.json({ ok:true, inventory: { water: n(user.water), fertilizer: n(user.fertilizer) } });
  } catch (e) {
    res.status(500).json({ error:'server error' });
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
        orcx: n(user.orcx),
        seedPotato: n(user.seedPotato),
        seedBarley: n(user.seedBarley)
      }
    });
  } catch {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ====== 로그인(기존 + Corn doc 보장) ======
app.post('/api/login', async (req, res) => {
  const { kakaoId, nickname } = req.body || {};
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
  await ensureCornDoc(kakaoId); // 옥수수 doc 보장
  res.json({ success: true, user });
});

// ====== 관리자/마켓(기존) ======
app.get('/api/admin/all-products-quantities', async (req, res) => {
  try {
    const users = await User.find({});
    const totals = {};
    users.forEach(u => {
      if (!u.products) return;
      for (const [name, qty] of Object.entries(u.products)) {
        totals[name] = (totals[name] || 0) + n(qty);
      }
    });
    res.json(Object.entries(totals).map(([name, total]) => ({ name, total })));
  } catch {
    res.status(500).json([]);
  }
});

app.get('/api/marketdata/products', async (req, res) => {
  try {
    const products = await MarketProduct.find({});
    res.json(products);
  } catch {
    res.status(500).json([]);
  }
});

app.get('/api/market/price-board', async (req, res) => {
  try {
    const products = await MarketProduct.find({ active: true, amount: { $gt: 0 } });
    res.json({
      success: true,
      priceList: products.map(x => ({ name: x.name, price: x.price, amount: x.amount, active: x.active }))
    });
  } catch {
    res.json({ success: false, priceList: [] });
  }
});

app.post('/api/marketdata/products/bulk', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: "배열 필요" });
    const results = [];
    for (const { name, price, amount } of items.slice(0, 5)) {
      if (!name || price == null || amount == null) continue;
      const found = await MarketProduct.findOne({ name });
      if (found) {
        found.price = Number(price); found.amount = Number(amount); found.active = true; await found.save();
        results.push(found);
      } else {
        results.push(await MarketProduct.create({ name, price: Number(price), amount: Number(amount), active: true }));
      }
    }
    res.json({ success: true, results });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.put('/api/marketdata/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    const prod = await MarketProduct.findByIdAndUpdate(id, update, { new: true });
    res.json(prod);
  } catch {
    res.status(500).json({});
  }
});
app.delete('/api/marketdata/products/:id', async (req, res) => {
  try {
    await MarketProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ====== 옥수수: 가격보드 ======
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
  } catch {
    res.status(500).json(await getPriceboard());
  }
});

// ====== 옥수수: 구매/심기/수확/뻥튀기/교환 ======
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
    const need  = n(unit) * q;

    if (n(user.orcx) < need) return res.status(400).json({ error: '토큰 부족' });

    const corn = await ensureCornDoc(kakaoId);
    user.orcx = n(user.orcx) - need;

    if (item === 'seed') {
      corn.seeds = n(corn.seeds) + q;
      await user.save(); await corn.save();
      return res.json({ wallet: { orcx: n(user.orcx) }, agri: { seed: n(corn.seeds) } });
    } else {
      corn.additives[item] = n(corn.additives[item]) + q;
      await user.save(); await corn.save();
      return res.json({ wallet: { orcx: n(user.orcx) }, additives: { salt: n(corn.additives.salt), sugar: n(corn.additives.sugar) } });
    }
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    if (n(corn.seeds) < 1) return res.status(400).json({ error: '씨앗 부족' });
    corn.seeds = n(corn.seeds) - 1;
    await corn.save();
    res.json({ ok: true, agri: { seed: n(corn.seeds) } });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    const gain = 5 + Math.floor(Math.random() * 4); // 5~8
    corn.corn = n(corn.corn) + gain;
    await corn.save();
    res.json({ gain, agri: { corn: n(corn.corn) } });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/pop', async (req, res) => {
  try {
    const { kakaoId, use } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const corn = await ensureCornDoc(kakaoId);
    if (n(corn.corn) < 1) return res.status(400).json({ error: '옥수수 부족' });

    // 사용할 첨가물 결정
    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if (n(corn.additives[pick]) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if (n(corn.additives[other]) < 1) return res.status(400).json({ error: '첨가물 부족' });
      pick = other;
    }

    // 차감
    corn.corn = n(corn.corn) - 1;
    corn.additives[pick] = n(corn.additives[pick]) - 1;

    // 60% 팝콘, 40% 토큰
    const POP_RATE = 0.6;
    const TOKEN_DROP = [1,2,3,5];
    const POP_DROP = [1,2];
    const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

    let result, qty;
    if (Math.random() < POP_RATE) {
      qty = rnd(POP_DROP);
      corn.popcorn = n(corn.popcorn) + qty;
      user.products = user.products || {};
      user.products.popcorn = n(user.products.popcorn) + qty;
      result = 'popcorn';
    } else {
      qty = rnd(TOKEN_DROP);
      user.orcx = n(user.orcx) + qty;
      result = 'token';
    }

    await user.save(); await corn.save();

    res.json({
      result, qty,
      wallet: { orcx: n(user.orcx) },
      food: { popcorn: n(corn.popcorn) },
      additives: { salt: n(corn.additives.salt), sugar: n(corn.additives.sugar) },
      agri: { corn: n(corn.corn) }
    });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// 팝콘 ↔ 비료 1:1 교환 (기본: popcorn -> fertilizer)
app.post('/api/corn/exchange', async (req, res) => {
  try {
    const { kakaoId, qty: rawQty, dir } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId required' });
    const qty = Math.max(1, Number(rawQty || 1));

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const corn = await ensureCornDoc(kakaoId);
    if (dir === 'fertilizer->popcorn') {
      if (n(user.fertilizer) < qty) return res.status(400).json({ error: 'no fertilizer' });
      user.fertilizer = n(user.fertilizer) - qty;
      corn.popcorn   = n(corn.popcorn) + qty;
      await CornTrade.create({ kakaoId, type: 'fertilizer->popcorn', qty });
    } else {
      if (n(corn.popcorn) < qty) return res.status(400).json({ error: 'no popcorn' });
      corn.popcorn   = n(corn.popcorn) - qty;
      user.fertilizer = n(user.fertilizer) + qty;
      await CornTrade.create({ kakaoId, type: 'popcorn->fertilizer', qty });
    }
    await Promise.all([user.save(), corn.save()]);
    res.json({ ok: true, user: { fertilizer: n(user.fertilizer) }, corn: { popcorn: n(corn.popcorn) } });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ====== 서버 시작 ======
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => {
  console.log(`🚀 Unified server listening on ${PORT}`);
});
