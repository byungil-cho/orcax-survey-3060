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
/* ===== PORT ATTACH (ADD-ONLY) =====
   - Ensure default port 3060 without changing existing lines.
   - If process.env.PORT is unset, set to '3060' so any later `const PORT = process.env.PORT || ` picks 3060.
*/
if (!process.env.PORT) { process.env.PORT = '3060'; }

// ====== (신규) 옥수수 전용 컬렉션 ======
const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId: { type: String, index: true, unique: true },
  // 옥수수/팝콘 수량
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  // 첨가물
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  // 씨옥수수(씨앗)
  seed: { type: Number, default: 0 }
}, { collection: 'corn_data' }));

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
  'http://localhost:3060',
  'http://localhost:5173'
];
app.use(cors({
  origin(origin, cb){
    if (!origin) return cb(null, true); // 서버 내부 호출/CLI 허용
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

// ====== Mongo 연결 ======
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
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
app.get('/api/ping', (req, res) => res.status(200).send('pong'));
// 옥수수/프론트 헬스체크
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ====== 감자: 출금/유저/마켓(기존) ======
app.post('/api/withdraw', async (req, res) => {
  const { nickname, email, phone, wallet, amount } = req.body;
  try {
    if (!nickname || !email || !phone || !wallet || isNaN(amount)) {
      return res.json({ success: false, message: "모든 정보를 입력해 주세요." });
    }
    await Withdraw.create({ name: nickname, email, phone, wallet, amount, createdAt: new Date() });
    res.json({ success: true, message: "출금 신청 완료" });
  } catch (e) {
    res.json({ success: false, message: "출금 신청 실패" });
  }
});

app.post('/api/user/update-token', async (req, res) => {
  const { kakaoId, orcx } = req.body;
  if (!kakaoId) return res.json({ success: false, message: '카카오ID 필요' });
  try {
    const user = await User.findOneAndUpdate({ kakaoId }, { orcx }, { new: true });
    if (!user) return res.json({ success: false, message: '유저 없음' });
    res.json({ success: true, user });
  } catch (e) {
    res.json({ success: false, message: 'DB 오류' });
  }
});

app.post('/api/withdraw/process', async (req, res) => {
  const { withdrawId, amount } = req.body;
  try {
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.json({ success: false, message: "출금 신청 내역 없음" });
    if (withdraw.completed) return res.json({ success: false, message: "이미 완료됨" });
    const user = await User.findOne({ nickname: withdraw.name });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    if ((user.orcx ?? 0) < amount) return res.json({ success: false, message: "토큰 부족" });
    user.orcx -= amount; await user.save();
    withdraw.completed = true; await withdraw.save();
    res.json({ success: true });
  } catch (e) {
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
      orcx: u.orcx ?? 0,
      water: u.water ?? 0,
      fertilizer: u.fertilizer ?? 0,
      potatoCount: u.storage?.gamja ?? 0,
      barleyCount: u.storage?.bori ?? 0,
      seedPotato: u.seedPotato ?? 0,
      seedBarley: u.seedBarley ?? 0,
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'DB 오류' });
  }
});

app.get('/api/withdraw', async (req, res) => {
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

// ====== 감자/보리 프론트 연동 (기존) + 옥수수 값 병합 추가 ======
async function ensureCornDoc(kakaoId) {
  let doc = await CornData.findOne({ kakaoId });
  if (!doc) doc = await CornData.create({ kakaoId });
  return doc;
}

app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // (추가) 옥수수 프로필 병합
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
        // 감자 호환
        orcx: user.orcx ?? 0,
        wallet: { orcx: user.orcx ?? 0 },
        potato: user.storage?.gamja ?? 0,
        barley: user.storage?.bori ?? 0,
        growth: user.growth ?? {},
        // (추가) 옥수수/첨가물/팝콘/씨앗
        agri: { corn: corn.corn ?? 0, seedCorn: (corn.seeds ?? 0) + (corn.seed ?? 0) },
        additives: { salt: corn.additives?.salt ?? 0, sugar: corn.additives?.sugar ?? 0 },
        food: { popcorn: corn.popcorn ?? 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ====== (신규) 재고(물/거름) 차감 — 안전 버전 ======
app.post('/api/user/inventory/use', async (req, res) => {
  try {
    const { kakaoId, type, amount } = req.body || {};
    const amt = Math.max(1, Number(amount || 1));
    if (!kakaoId || !['water','fertilizer'].includes(type)) {
      return res.status(400).json({ error:'kakaoId, type(water|fertilizer) 필요' });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'User not found' });

    // 숫자 보정
    const curWater = Number(user.water ?? 0);
    const curFerti = Number(user.fertilizer ?? 0);
    const cur = (type === 'water') ? curWater : curFerti;

    if (cur < amt) {
      return res.status(400).json({
        error:'재고 부족',
        inventory: { water: curWater, fertilizer: curFerti }
      });
    }

    // 차감 및 저장
    if (type === 'water') user.water = curWater - amt;
    else user.fertilizer = curFerti - amt;
    await user.save();

    return res.json({
      ok:true,
      inventory: { water: Number(user.water ?? 0), fertilizer: Number(user.fertilizer ?? 0) }
    });
  } catch (e) {
    console.error('inventory/use error:', e);
    res.status(500).json({ error:'server error' });
  }
});

// ====== v2data (기존) ======
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
  // (추가) 옥수수 도큐먼트도 생성 보장
  await ensureCornDoc(kakaoId);

  res.json({ success: true, user });
});

// ====== 관리자/마켓(기존) ======
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
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get('/api/marketdata/products', async (req, res) => {
  try {
    const products = await MarketProduct.find({});
    res.json(products);
  } catch (e) {
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
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.put('/api/marketdata/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const prod = await MarketProduct.findByIdAndUpdate(id, update, { new: true });
    res.json(prod);
  } catch (e) {
    res.status(500).json({});
  }
});
app.delete('/api/marketdata/products/:id', async (req, res) => {
  try {
    await MarketProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// ====== (신규) 옥수수: 가격보드 ======
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
    const { kakaoId } = req.body || {};
    let { item, type, qty, amount } = req.body || {};
    item = item || type; // alias 허용
    const q = Math.max(1, Number(qty ?? amount ?? 1));
    if (!kakaoId || !item) return res.status(400).json({ error: 'kakaoId,item 필요' });

    // item 표준화
    if (item === 'seeds') item = 'seed';
    if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error: 'unknown item' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const price = await getPriceboard();
    const unit  = item === 'salt' ? price.salt : item === 'sugar' ? price.sugar : price.seed;
    const need  = unit * q;

    if ((user.orcx || 0) < need) return res.status(402).json({ error: '토큰 부족' });

    // 차감
    user.orcx = (user.orcx || 0) - need;

    // corn_data 증가
    const corn = await ensureCornDoc(kakaoId);
    if (item === 'seed') {
      corn.seed = (corn.seed || 0) + q;             // ★ 최상위 seed 증가
    } else {
      corn.additives = corn.additives || {};
      corn.additives[item] = (corn.additives[item] || 0) + q;
    }

    await user.save();
    await corn.save();

    // 200 OK + 최신 상태 반환 (프런트는 2xx면 성공 처리)
    return res.json({
      ok: true,
      wallet: { orcx: user.orcx || 0 },
      agri: { seeds: (corn.seed || 0) },           // 합산 없이 단일 필드
      additives: { salt: (corn.additives?.salt || 0), sugar: (corn.additives?.sugar || 0) }
    });
  } catch (e) {
    console.error('[buy-additive]', e);
    res.status(500).json({ error: 'server error' });
  }
});app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    if ((corn.seed || 0) < 1) return res.status(400).json({ error: '씨앗 부족' });
    corn.seed -= 1;
    await corn.save();
    res.json({ ok: true, seeds: corn.seed || 0 });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);

    // 간단 로직: 5~8개 수확
    const gain = 5 + Math.floor(Math.random() * 4);
    corn.corn = (corn.corn || 0) + gain;
    await corn.save();

    res.json({
      gain,
      agri: { corn: corn.corn || 0 }
    });
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

    const corn = await ensureCornDoc(kakaoId);
    if ((corn.corn || 0) < 1) return res.status(400).json({ error: '옥수수 부족' });

    // 사용할 첨가물 결정
    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if ((corn.additives[pick] || 0) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if ((corn.additives[other] || 0) < 1) {
        return res.status(400).json({ error: '첨가물 부족' });
      }
      pick = other;
    }

    // 차감
    corn.corn -= 1;
    corn.additives[pick] -= 1;

    // 60% 팝콘, 40% 토큰
    const POP_RATE = 0.6;
    const TOKEN_DROP = [1,2,3,5];
    const POP_DROP = [1,2];
    const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

    let result, qty;
    if (Math.random() < POP_RATE) {
      qty = rnd(POP_DROP);
      corn.popcorn = (corn.popcorn || 0) + qty;

      // 마켓과 호환 위해 user.products.popcorn도 올려줌
      user.products = user.products || {};
      user.products.popcorn = (user.products.popcorn || 0) + qty;

      result = 'popcorn';
    } else {
      qty = rnd(TOKEN_DROP);
      user.orcx = (user.orcx || 0) + qty;
      result = 'token';
    }

    await user.save();
    await corn.save();

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


/* ===== [ADD][SAFE] OrcaX corn/userdata compatibility additions (no base edits) ===== */

/** 1) 사전 정규화 미들웨어: seeds → seed, query→body (userdata) */
try {
  // POST /api/corn/buy-additive 에서 item=seeds 로 와도 처리되도록
  app.use('/api/corn/buy-additive', express.json(), (req, res, next) => {
    try {
      if (req.method === 'POST' && req.body && req.body.item === 'seeds') req.body.item = 'seed';
    } catch {}
    next();
  });

  // GET/POST /api/userdata 호출 시 kakaoId/nickname 이 query로 와도 body에 채워서 기존 코드가 그대로 동작
  app.use('/api/userdata', express.json(), (req, res, next) => {
    try {
      if (req.method === 'GET' || req.method === 'POST') {
        req.body = req.body || {};
        if (!req.body.kakaoId  && req.query && req.query.kakaoId)  req.body.kakaoId  = req.query.kakaoId;
        if (!req.body.nickname && req.query && req.query.nickname) req.body.nickname = req.query.nickname;
      }
    } catch {}
    next();
  });
} catch {}

/** 2) Corn 모델/헬퍼 (기존과 충돌 없이 안전 생성) */
const __ORCAX_n = v => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
let __CornModel;
try {
  __CornModel = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
    kakaoId:  { type: String, index: true, unique: true },
    corn:     { type: Number, default: 0 },
    popcorn:  { type: Number, default: 0 },
    seeds:    { type: Number, default: 0 },
    additives:{ salt: { type: Number, default: 0 }, sugar: { type: Number, default: 0 } }
  }, { collection: 'corn_data' }));
} catch { __CornModel = mongoose.models.CornData; }

async function __ensureCornDoc(kakaoId) {
  let doc = await __CornModel.findOne({ kakaoId });
  if (!doc) doc = await __CornModel.create({ kakaoId });
  if (!doc.additives) doc.additives = { salt:0, sugar:0 };
  return doc;
}

/** 3) GET /api/userdata (구버전/GET 호환) – 기존 POST 로직은 그대로 두고, GET을 ‘추가’ */
if (!app.locals.__orcax_added_get_userdata) {
  app.locals.__orcax_added_get_userdata = true;
  app.get('/api/userdata', async (req, res) => {
    try {
      const kakaoId  = (req.query && req.query.kakaoId)  || (req.body && req.body.kakaoId)  || null;
      const nickname = (req.query && req.query.nickname) || (req.body && req.body.nickname) || null;
      let user = null;
      if (kakaoId)      user = await (User.findOne({ kakaoId }));
      else if (nickname) user = await (User.findOne({ nickname }));
      if (!user) return res.status(404).json({ success:false, message:'User not found' });

      const corn = await __ensureCornDoc(user.kakaoId || kakaoId);

      return res.json({
        success: true,
        user: {
          nickname: user.nickname,
          inventory: {
            water:       __ORCAX_n(user.water),
            fertilizer:  __ORCAX_n(user.fertilizer),
            seedPotato:  __ORCAX_n(user.seedPotato),
            seedBarley:  __ORCAX_n(user.seedBarley)
          },
          orcx:   __ORCAX_n(user.orcx),
          wallet: { orcx: __ORCAX_n(user.orcx) },
          potato: __ORCAX_n(user.storage && user.storage.gamja),
          barley: __ORCAX_n(user.storage && user.storage.bori),
          growth: user.growth || {},
          // corn 영역도 함께 내려줌 (프론트 보강)
          agri:      { corn: __ORCAX_n(corn.corn),   seedCorn: __ORCAX_n((corn.seeds || 0) + (corn.seed || 0)) },
          additives: { salt: __ORCAX_n(corn.additives && corn.additives.salt), sugar: __ORCAX_n(corn.additives && corn.additives.sugar) },
          food:      { popcorn: __ORCAX_n(corn.popcorn) }
        }
      });
    } catch (e) {
      res.status(500).json({ success:false, message:'서버 오류' });
    }
  });
}

/** 4) GET /api/corn/summary – corn-farm 상단 리소스를 한 번에 조회 (추가만) */
if (!app.locals.__orcax_added_corn_summary) {
  app.locals.__orcax_added_corn_summary = true;
  app.get('/api/corn/summary', async (req, res) => {
    try {
      const kakaoId = (req.query && req.query.kakaoId) || (req.body && req.body.kakaoId);
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const user = await User.findOne({ kakaoId });
      if (!user) return res.status(404).json({ ok:false, error:'User not found' });

      const corn = await __ensureCornDoc(kakaoId);

      res.json({
        ok: true,
        wallet:    { orcx: __ORCAX_n(user.orcx) },
        inventory: { water: __ORCAX_n(user.water), fertilizer: __ORCAX_n(user.fertilizer) },
        agri:      { corn: __ORCAX_n(corn.corn), seeds: __ORCAX_n((corn.seeds || 0) + (corn.seed || 0)) },
        additives: { salt: __ORCAX_n(corn.additives && corn.additives.salt), sugar: __ORCAX_n(corn.additives && corn.additives.sugar) },
        food:      { popcorn: __ORCAX_n(corn.popcorn) }
      });
    } catch (e) {
      res.status(500).json({ ok:false, error:'server error' });
    }
  });
}

/** 5) POST /api/corn/exchange – 팝콘 ↔ 비료 1:1 교환 (추가만) */
if (!app.locals.__orcax_added_corn_exchange) {
  app.locals.__orcax_added_corn_exchange = true;
  app.post('/api/corn/exchange', async (req, res) => {
    try {
      const body = req.body || {};
      const kakaoId = body.kakaoId;
      if (!kakaoId) return res.status(400).json({ error:'kakaoId required' });
      const qty = Math.max(1, Number(body.qty || 1));
      const dir = body.dir;

      const user = await User.findOne({ kakaoId });
      if (!user) return res.status(404).json({ error:'user not found' });

      const corn = await __ensureCornDoc(kakaoId);

      if (dir === 'fertilizer->popcorn') {
        if ( __ORCAX_n(user.fertilizer) < qty ) return res.status(400).json({ error:'no fertilizer' });
        user.fertilizer = __ORCAX_n(user.fertilizer) - qty;
        corn.popcorn   = __ORCAX_n(corn.popcorn)    + qty;
      } else {
        if ( __ORCAX_n(corn.popcorn) < qty ) return res.status(400).json({ error:'no popcorn' });
        corn.popcorn   = __ORCAX_n(corn.popcorn)    - qty;
        user.fertilizer = __ORCAX_n(user.fertilizer) + qty;
      }

      await Promise.all([ user.save(), corn.save() ]);

      res.json({ ok:true,
        user: { fertilizer: __ORCAX_n(user.fertilizer) },
        corn: { popcorn:   __ORCAX_n(corn.popcorn) }
      });
    } catch (e) {
      res.status(500).json({ error:'server error' });
    }
  });
}
/** 6) POST /api/corn/grow – 프론트 진행바 갱신용(추가만, DB 비침투) */
if (!app.locals.__orcax_added_corn_grow) {
  app.locals.__orcax_added_corn_grow = true;
  app.post('/api/corn/grow', async (req, res) => {
    try {
      const { kakaoId, step } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      // 기존 스키마는 g/phase 필드가 없으므로, DB는 건드리지 않고 응답만 반환(무해).
      const inc = Math.max(1, Number(step || 5));
      return res.json({ ok:true, gIncreasedBy: inc });
    } catch (e) {
      return res.status(500).json({ ok:false, error:'server error' });
    }
  });
}

/** 7) GET /api/corn/status – summary 별칭(추가만) */
if (!app.locals.__orcax_added_corn_status_alias) {
  app.locals.__orcax_added_corn_status_alias = true;
  app.get('/api/corn/status', async (req, res) => {
    // 이미 구현된 /api/corn/summary 로 위임 (기존 코드 재사용, 무해)
    req.url = '/api/corn/summary' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    app._router.handle(req, res, () => res.status(404).end());
  });
}
/* ===== CORN ROUTER ATTACH (ADD-ONLY) =====
   - Attach external corn router at /api/corn without touching existing routers.
   - Resolves several common paths; warns if not found.
*/
(function attachCornRouter(appRef){
  try {
    if (!appRef.locals) appRef.locals = {};
    if (appRef.locals.__CORN_ROUTER_ATTACHED__) return;
    const path = require('path');
    const tryPaths = [
      './routes/corn',
      './routes/corn.js',
      './router/corn',
      './api/corn',
      './routers/corn',
      './routes/corn'
    ];

    let mod = null, resolved = null, errLast = null;
    for (const p of tryPaths) {
      try {
        resolved = p;
        mod = require(p);
        break;
      } catch (e) { errLast = e; mod = null; resolved = null; }
    }
    if (!mod) {
      console.warn('[CORN-ATTACH] corn router module not found. Tried:', tryPaths.join(', '));
      if (errLast) console.warn('[CORN-ATTACH] last error:', errLast.message);
      return;
    }
    const cornRouter = (mod.default || mod);
    if (typeof cornRouter !== 'function') {
      console.warn('[CORN-ATTACH] router module does not export a function/router');
      return;
    }
    appRef.use('/api/corn', cornRouter);
    appRef.locals.__CORN_ROUTER_ATTACHED__ = true;
    console.log('🌽 corn router attached at /api/corn');
  } catch (e) {
    console.warn('[CORN-ATTACH] failed to attach corn router:', e && e.message);
  }
})(app);