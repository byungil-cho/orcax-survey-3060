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
  seeds: { type: Number, default: 0 }
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
  'http://localhost:3000',
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

// [ADD] Serve JS assets from /js (for game frontend loading from backend)
app.use('/js', express.static(path.join(__dirname, 'js')));
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
  res.json({ status: mongoReady ? "정상" : "오류", mongo: mongoReady })

// [ADD] CornTrade model: logs popcorn↔fertilizer exchanges
const CornTrade = mongoose.models.CornTrade || mongoose.model('CornTrade', new mongoose.Schema({
  kakaoId: { type: String, index: true },
  type: { type: String, default: 'popcorn->fertilizer' },
  qty: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'corn_trades' }));
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
        agri: { corn: corn.corn ?? 0, seedCorn: corn.seeds ?? 0 },
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
    // 차감/가산
    user.orcx = (user.orcx || 0) - need;

    if (item === 'seed') {
      corn.seeds = (corn.seeds || 0) + q;
      await user.save();
      await corn.save();
      return res.json({
        wallet: { orcx: user.orcx || 0 },
        seeds: corn.seeds || 0
      });
    } else {
      corn.additives[item] = (corn.additives[item] || 0) + q;
      await user.save();
      await corn.save();
      return res.json({
        wallet: { orcx: user.orcx || 0 },
        additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
      });
    }
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// 씨앗 심기(씨앗 1개 차감)
app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    if ((corn.seeds || 0) < 1) return res.status(400).json({ error: '씨앗 부족' });
    corn.seeds -= 1;
    await corn.save();
    res.json({ ok: true, seeds: corn.seeds || 0 });
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
// [ADD] 팝콘 ↔ 거름 1:1 교환 (기본: popcorn -> fertilizer)
app.post('/api/corn/exchange', async (req, res) => {
  try {
    const { kakaoId, from='popcorn', to='fertilizer', qty=1 } = req.body || {};
    const q = Number(qty) || 1;
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    if (!(q > 0)) return res.status(400).json({ error: '유효하지 않은 수량' });
    if (!(from==='popcorn' && to==='fertilizer')) {
      return res.status(400).json({ error: '현재는 popcorn→fertilizer만 지원' });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const corn = await ensureCornDoc(kakaoId);
    if ((corn.popcorn || 0) < q) return res.status(400).json({ error: '팝콘 부족' });

    // 거래 반영
    corn.popcorn -= q;
    user.fertilizer = (user.fertilizer || 0) + q;

    await corn.save();
    await user.save();

    // 거래 로그
    await CornTrade.create({ kakaoId, qty: q });

    return res.json({
      ok: true,
      food: { popcorn: corn.popcorn || 0 },
      inventory: { fertilizer: user.fertilizer || 0 }
    });
  } catch (e) {
    console.error('exchange error', e);
    return res.status(500).json({ error: 'server error' });
  }
});
// [ADD] 유저 경험치/레벨 동기화(선택): 클라이언트가 레벨업 시 서버에도 반영
app.post('/api/user/exp', async (req, res) => {
  try {
    const { kakaoId, expGain=0, level } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 단순 동기화: level이 클라이언트가 계산한 값보다 낮으면 올림
    if (typeof level === 'number' && level > (user.level || 1)) user.level = level;
    // exp는 저장 필드가 있다면 추가(없으면 무시)
    if (typeof user.exp === 'number') user.exp += Number(expGain)||0;

    await user.save();
    return res.json({ ok: true, level: user.level || 1, exp: user.exp || 0 });
  } catch (e) {
    console.error('user/exp error', e);
    return res.status(500).json({ error: 'server error' });
  }
});



// ====== 서버 시작 ======
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});



// ===== C O R N   A P I   R O U T E S =====

// Get user corn data
app.get('/api/corn/userdata', async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await db.collection('corn').findOne({ userId });
    res.json(data || {});
  } catch (err) {
    console.error('Error fetching corn userdata:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Plant corn
app.post('/api/corn/plant', async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fieldId, seedType } = req.body;
    const update = { $set: { [`fields.${fieldId}`]: { seedType, plantedAt: new Date() } } };
    await db.collection('corn').updateOne({ userId }, update, { upsert: true });

    res.json({ success: true });
  } catch (err) {
    console.error('Error planting corn:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Harvest corn
app.post('/api/corn/harvest', async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fieldId } = req.body;
    const userData = await db.collection('corn').findOne({ userId });
    if (!userData || !userData.fields || !userData.fields[fieldId]) {
      return res.status(400).json({ error: 'No crop to harvest' });
    }

    const harvested = userData.fields[fieldId];
    const update = { $unset: { [`fields.${fieldId}`]: "" } };
    await db.collection('corn').updateOne({ userId }, update);

    res.json({ success: true, harvested });
  } catch (err) {
    console.error('Error harvesting corn:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
