// server-unified.js - OrcaX 통합 서버 (감자 + 옥수수 지원)
// ※ 다른 파일 건드리지 않고, 이 파일만으로 옥수수 엔진을 추가/안정화
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
   process.env.PORT 미설정 시 3060 고정 (기존 라인이 뒤에 있어도 3060 보장)
*/
if (!process.env.PORT) { process.env.PORT = '3060'; }

// ====== (신규) 옥수수 전용 컬렉션 ======
const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId: { type: String, index: true, unique: true },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  // 일부 프론트는 seeds, 일부는 seed 를 사용하므로 둘 다 허용
  seed:  { type: Number, default: 0 },
  seeds: { type: Number, default: 0 },
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
    } catch { return cb(null, false); }
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

// ====== 공통 유틸 ======
const _N = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

// duplicate key 에 안전한 corn doc 보장
async function ensureCornDoc(kakaoId) {
  let doc = await CornData.findOne({ kakaoId });
  if (doc) return doc;
  try {
    return await CornData.create({ kakaoId });
  } catch (e) {
    // 동시 요청 등으로 unique 충돌 시 재조회
    return await CornData.findOne({ kakaoId });
  }
}

// ====== 감자/보리 프론트 연동 (기존) + 옥수수 값 병합 추가 ======
// (프론트 호환) /api/userdata 는 GET/POST/Query 모두 허용, kakaoId 없으면 needLogin
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

app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.json({ success:false, needLogin:true, message:'kakaoId required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 옥수수 프로필 병합
    const corn = await ensureCornDoc(kakaoId);
    const seedSum = _N(corn.seeds) + _N(corn.seed);

    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        inventory: {
          water: _N(user.water),
          fertilizer: _N(user.fertilizer),
          seedPotato: _N(user.seedPotato),
          seedBarley: _N(user.seedBarley)
        },
        // 감자 호환
        orcx: _N(user.orcx),
        wallet: { orcx: _N(user.orcx) },
        potato: _N(user.storage && user.storage.gamja),
        barley: _N(user.storage && user.storage.bori),
        growth: user.growth || {},
        // 옥수수/첨가물/팝콘/씨앗
        agri:      { corn: _N(corn.corn),   seedCorn: _N(seedSum) },
        additives: { salt: _N(corn.additives && corn.additives.salt), sugar: _N(corn.additives && corn.additives.sugar) },
        food:      { popcorn: _N(corn.popcorn) }
      }
    });
  } catch (err) {
    console.error('[userdata] error:', err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 구버전 호환: GET /api/userdata
if (!app.locals.__ORCAX_GET_USERDATA__) {
  app.locals.__ORCAX_GET_USERDATA__ = true;
  app.get('/api/userdata', async (req, res) => {
    try {
      const kakaoId  = (req.query && req.query.kakaoId)  || (req.body && req.body.kakaoId)  || null;
      const nickname = (req.query && req.query.nickname) || (req.body && req.body.nickname) || null;
      let user = null;
      if (kakaoId)      user = await User.findOne({ kakaoId });
      else if (nickname) user = await User.findOne({ nickname });

      if (!user) return res.status(404).json({ success:false, message:'User not found' });

      const corn = await ensureCornDoc(user.kakaoId || kakaoId);
      const seedSum = _N(corn.seeds) + _N(corn.seed);

      res.json({
        success: true,
        user: {
          nickname: user.nickname,
          inventory: {
            water: _N(user.water),
            fertilizer: _N(user.fertilizer),
            seedPotato: _N(user.seedPotato),
            seedBarley: _N(user.seedBarley)
          },
          orcx: _N(user.orcx),
          wallet: { orcx: _N(user.orcx) },
          potato: _N(user.storage && user.storage.gamja),
          barley: _N(user.storage && user.storage.bori),
          growth: user.growth || {},
          agri:      { corn: _N(corn.corn), seedCorn: _N(seedSum) },
          additives: { salt: _N(corn.additives && corn.additives.salt), sugar: _N(corn.additives && corn.additives.sugar) },
          food:      { popcorn: _N(corn.popcorn) }
        }
      });
    } catch (e) {
      console.error('[GET /api/userdata] error:', e);
      res.status(500).json({ success:false, message:'서버 오류' });
    }
  });
}

      // 마켓 호환: user.products.popcorn도 증가
      user.products = user.products || {};
      user.products.popcorn = _N(user.products.popcorn) + qty;

      result = 'popcorn';
    } else {
      qty = rnd(TOKEN_DROP);
      user.orcx = _N(user.orcx) + qty;
      result = 'token';
    }

    await user.save();
    await corn.save();

    res.json({
      result, qty,
      wallet: { orcx: _N(user.orcx) },
      food: { popcorn: _N(corn.popcorn) },
      additives: { salt: _N(corn.additives.salt), sugar: _N(corn.additives.sugar) },
      agri: { corn: _N(corn.corn) }
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});
/* ===== Legacy Market Compatibility Layer (ONLY server-unified.js) =====
   gamja-market.html 이 예전에 사용하던 경로/응답을 그대로 복구
   사용 모델: MarketProduct, User (이미 파일 상단에서 선언됨)
*/
function _num(x){ x = Number(x); return Number.isFinite(x) ? x : 0; }

// 현재 판매 가능한 목록
async function _getActivePriceList(){
  const items = await MarketProduct.find({ active: true, amount: { $gt: 0 } }).lean();
  return (items || []).map(it => ({
    name: it.name,
    price: _num(it.price),
    amount: _num(it.amount),
    active: !!it.active
  }));
}

// 시세 전광판 (예전 프론트가 사용)
app.get('/api/market/price-board', async (req, res) => {
  try {
    const priceList = await _getActivePriceList();
    return res.json({ success: true, priceList });
  } catch (e) {
    console.error('[market/price-board]', e);
    return res.status(500).json({ success:false, message:'server error' });
  }
});

// 별칭 (혹시 다른 경로로 부를 경우)
app.get('/api/market/prices', async (req, res) => {
  try {
    const priceList = await _getActivePriceList();
    return res.json({ success: true, priceList });
  } catch { return res.status(500).json({ success:false }); }
});

// 전체 상품 목록 (관리/확인용) — 기존 페이지가 /marketdata를 볼 때 호환
app.get('/api/marketdata/products', async (req, res) => {
  try {
    const list = await MarketProduct.find({}).lean();
    return res.json({ success:true, products: list });
  } catch { return res.status(500).json({ success:false, products: [] }); }
});

// 제품 판매 → ORCX 획득
app.post('/api/market/sell', async (req, res) => {
  try {
    const { kakaoId, item, qty } = req.body || {};
    if(!kakaoId || !item) return res.status(400).json({ success:false, message:'params' });
    const q = Math.max(1, _num(qty));

    const user = await User.findOne({ kakaoId });
    if(!user) return res.status(404).json({ success:false, message:'user' });

    const prod = await MarketProduct.findOne({ name: item, active: true });
    if(!prod || _num(prod.amount) < q) return res.status(400).json({ success:false, message:'out of stock' });

    const gain = _num(prod.price) * q;

    // 유저 보관함 차감 (popcorn/chips 등 키로 저장되어 있다고 가정)
    user.products = user.products || {};
    const cur = _num(user.products[item]);
    if (cur < q) return res.status(400).json({ success:false, message:'no item' });
    user.products[item] = cur - q;

    // 재고 감소, 토큰 지급
    prod.amount = _num(prod.amount) - q;
    user.orcx   = _num(user.orcx) + gain;

    await Promise.all([ prod.save(), user.save() ]);

    return res.json({
      success:true,
      wallet:{ orcx: _num(user.orcx) },
      products: user.products,
      sold:{ item, qty:q, gain }
    });
  } catch (e) {
    console.error('[market/sell]', e);
    return res.status(500).json({ success:false, message:'server error' });
  }
});

// 가공식품 ↔ 물/거름 교환 (기본 규칙: 1개 ↔ 자원 3)
app.post('/api/market/exchange', async (req, res) => {
  try {
    const { kakaoId, item, qty, to } = req.body || {};
    if(!kakaoId || !item || !to) return res.status(400).json({ success:false });

    const q = Math.max(1, _num(qty));
    const user = await User.findOne({ kakaoId });
    if(!user) return res.status(404).json({ success:false });

    user.products = user.products || {};
    const cur = _num(user.products[item]);
    if (cur < q) return res.status(400).json({ success:false, message:'no item' });

    const ratio = 3;
    const give = q * ratio;

    if (to === 'water'){
      user.products[item] = cur - q;
      user.water = _num(user.water) + give;
    } else if (to === 'fertilizer'){
      user.products[item] = cur - q;
      user.fertilizer = _num(user.fertilizer) + give;
    } else {
      return res.status(400).json({ success:false, message:'to must be water|fertilizer' });
    }

    await user.save();
    return res.json({
      success:true,
      inventory:{ water:_num(user.water), fertilizer:_num(user.fertilizer) },
      products: user.products
    });
  } catch (e) {
    console.error('[market/exchange]', e);
    return res.status(500).json({ success:false });
  }
});

// 기본 시세/재고 일괄 등록 (비어 있을 때 한 번만 실행)
app.post('/api/marketdata/products/bulk', async (req, res) => {
  try {
    const items = (req.body && req.body.items) || [];
    const ops = items.map(async it => {
      const { name, price, amount } = it;
      const doc = await MarketProduct.findOne({ name });
      if (!doc) {
        return MarketProduct.create({ name, price:_num(price), amount:_num(amount), active:true });
      }
      doc.price  = _num(price ?? doc.price);
      doc.amount = _num(amount ?? doc.amount);
      doc.active = true;
      return doc.save();
    });
    await Promise.all(ops);
    const products = await MarketProduct.find({}).lean();
    return res.json({ success:true, products });
  } catch (e) {
    console.error('[marketdata/bulk]', e);
    return res.status(500).json({ success:false });
  }
});

// 요약/상태/교환/성장 (추가 라우트)
if (!app.locals.__ORCAX_CORN_MISC__) {
  app.locals.__ORCAX_CORN_MISC__ = true;

  app.get('/api/corn/summary', async (req, res) => {
    try {
      const kakaoId = (req.query && req.query.kakaoId) || (req.body && req.body.kakaoId);
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const user = await User.findOne({ kakaoId });
      if (!user) return res.status(404).json({ ok:false, error:'User not found' });

      const corn = await ensureCornDoc(kakaoId);
      const seedSum = _N(corn.seeds) + _N(corn.seed);

      res.json({
        ok: true,
        wallet:    { orcx: _N(user.orcx) },
        inventory: { water: _N(user.water), fertilizer: _N(user.fertilizer) },
        agri:      { corn: _N(corn.corn), seeds: _N(seedSum) },
        additives: { salt: _N(corn.additives?.salt), sugar: _N(corn.additives?.sugar) },
        food:      { popcorn: _N(corn.popcorn) }
      });
    } catch (e) {
      res.status(500).json({ ok:false, error:'server error' });
    }
  });

  app.get('/api/corn/status', (req, res, next) => {
    // summary 별칭
    req.url = '/api/corn/summary' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    app._router.handle(req, res, () => res.status(404).end());
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
        if (_N(user.fertilizer) < qty) return res.status(400).json({ error:'no fertilizer' });
        user.fertilizer = _N(user.fertilizer) - qty;
        corn.popcorn   = _N(corn.popcorn) + qty;
      } else {
        if (_N(corn.popcorn) < qty) return res.status(400).json({ error:'no popcorn' });
        corn.popcorn   = _N(corn.popcorn) - qty;
        user.fertilizer = _N(user.fertilizer) + qty;
      }

      await Promise.all([ user.save(), corn.save() ]);

      res.json({ ok:true,
        user: { fertilizer: _N(user.fertilizer) },
        corn: { popcorn:   _N(corn.popcorn) }
      });
    } catch (e) {
      res.status(500).json({ error:'server error' });
    }
  });

  app.post('/api/corn/grow', (req, res) => {
    try {
      const { kakaoId, step } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const inc = Math.max(1, Number(step || 5));
      return res.json({ ok:true, gIncreasedBy: inc });
    } catch {
      return res.status(500).json({ ok:false, error:'server error' });
    }
  });
}

/* =====(선택) /api/userdata 응답에 corn 값 동봉 — 감자 프론트 호환 강화 ===== */
app.post('/api/userdata', async (req,res,next)=>{
  // 이미 응답을 보냈으면 skip
  if (res.headersSent) return;
  try{
    const kakaoId = req.body?.kakaoId || req.query?.kakaoId;
    if(!kakaoId) return next();
    const c = await ensureCornDoc(kakaoId);
    // res.json(...)을 이 미들웨어에서 직접 하지는 않고, req.locals에 실어두면
    // 뒤 라우터에서 참고할 수 있습니다. (감자 라우터가 이미 응답하면 자동 무시)
    req.cornPacked = {
      agri:      { corn:N(c.corn), seedCorn:N(c.seed)+N(c.seeds) },
      additives: { salt:N(c.additives?.salt), sugar:N(c.additives?.sugar) },
      food:      { popcorn:N(c.popcorn) }
    };
    return next();
  }catch{ return next(); }
});

/* ===== CORN ENGINE ATTACH (conflict-free) ===== */
(() => {
  // 1) 외부 라우터 탐색
  const tryPaths = ['./routes/corn','./corn','./engine/corn','./corn-engine','./api/corn'];
  let router = null;
  for (const p of tryPaths) {
    try {
      const mod = require(p);
      const ext = mod.default || mod;
      if (typeof ext === 'function') {
        router = ext;
        app.locals.__CORN_EXTERNAL__ = true;
        console.log('🌽 External corn engine attached at /api/corn from', p);
        break;
      }
    } catch {}
  }

  // 2) 외부가 없을 때만 내장 라우터 생성
  if (!router) {
    console.log('🌽 External corn engine not found. Using built-in engine.');
    const N = v => (Number.isFinite(+v) ? +v : 0);

    const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
      kakaoId: { type: String, unique: true, index: true },
      corn: { type: Number, default: 0 },
      popcorn: { type: Number, default: 0 },
      seed: { type: Number, default: 0 },
      seeds:{ type: Number, default: 0 },
      additives: { salt:{type:Number,default:0}, sugar:{type:Number,default:0} }
    }, { collection: 'corn_data' }));

    const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', new mongoose.Schema({
      priceboard: { salt:{type:Number,default:10}, sugar:{type:Number,default:20}, seed:{type:Number,default:30}, currency:{type:String,default:'ORCX'} }
    }, { collection: 'corn_settings' }));

    async function ensureCornDoc(kakaoId){
      let d = await CornData.findOne({ kakaoId });
      if (d) return d;
      try { return await CornData.create({ kakaoId }); }
      catch { return await CornData.findOne({ kakaoId }); }
    }
    async function getPB(){ const s = await CornSettings.findOne(); return s?.priceboard || { salt:10, sugar:20, seed:30, currency:'ORCX' }; }
    async function setPB(u){ let s = await CornSettings.findOne(); if(!s) s = await CornSettings.create({}); s.priceboard = { ...(s.priceboard?.toObject?.()||s.priceboard||{}), ...u }; await s.save(); return s.priceboard; }

    const corn = express.Router();

    // 공통 kakaoId 파싱
    corn.use((req,_res,next)=>{
      if (!req.body) req.body = {};
      if (!req.body.kakaoId && req.query?.kakaoId) req.body.kakaoId = req.query.kakaoId;
      next();
    });

    // summary
    corn.get('/summary', async (req,res)=>{
      try{
        const kakaoId = req.query.kakaoId;
        if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
        const user = await User.findOne({ kakaoId });
        if(!user) return res.status(404).json({ ok:false, error:'user not found' });
        const c = await ensureCornDoc(kakaoId);
        const seeds = N(c.seed)+N(c.seeds);
        res.json({ ok:true,
          wallet:{ orcx:N(user.orcx) },
          inventory:{ water:N(user.water), fertilizer:N(user.fertilizer) },
          agri:{ corn:N(c.corn), seeds },
          additives:{ salt:N(c.additives?.salt), sugar:N(c.additives?.sugar) },
          food:{ popcorn:N(c.popcorn) }
        });
      }catch(e){ res.status(500).json({ ok:false, error:'server error' }); }
    });

    // priceboard
    corn.get('/priceboard', async (_req,res)=>{ res.json(await getPB()); });
    corn.patch('/priceboard', async (req,res)=>{
      const { salt, sugar, seed, currency } = req.body||{};
      const u = {};
      if (Number.isFinite(+salt))  u.salt  = +salt;
      if (Number.isFinite(+sugar)) u.sugar = +sugar;
      if (Number.isFinite(+seed))  u.seed  = +seed;
      if (currency) u.currency = String(currency);
      res.json(await setPB(u));
    });

    // buy additive/seed
    corn.post('/buy-additive', async (req,res)=>{
      try{
        let { kakaoId, item, qty } = req.body||{};
        if(!kakaoId || !item) return res.status(400).json({ error:'params' });
        qty = Math.max(1, N(qty));
        if (item==='seeds') item='seed';
        if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error:'item' });

        const user = await User.findOne({ kakaoId });
        if(!user) return res.status(404).json({ error:'user' });
        const pb = await getPB();
        const unit = item==='salt'?pb.salt:item==='sugar'?pb.sugar:pb.seed;
        const need = unit*qty;
        if (N(user.orcx) < need) return res.status(402).json({ error:'ORCX 부족' });

        const c = await ensureCornDoc(kakaoId);
        user.orcx = N(user.orcx) - need;
        if (item==='seed') c.seed = N(c.seed) + qty;
        else {
          c.additives = c.additives || {};
          c.additives[item] = N(c.additives[item]) + qty;
        }
        await Promise.all([user.save(), c.save()]);
        res.json({ ok:true, wallet:{ orcx:N(user.orcx) }, additives:c.additives, agri:{ seeds:N(c.seed)+N(c.seeds) }});
      }catch(e){ res.status(500).json({ error:'server error' }); }
    });

    // plant / harvest / pop
    corn.post('/plant', async (req,res)=>{
      try{
        const { kakaoId } = req.body||{};
        if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
        const c = await ensureCornDoc(kakaoId);
        const total = N(c.seed)+N(c.seeds);
        if (total < 1) return res.status(400).json({ error:'no seeds' });
        if (N(c.seed)>0) c.seed = N(c.seed) - 1; else c.seeds = Math.max(0, N(c.seeds)-1);
        await c.save(); res.json({ ok:true, seeds:N(c.seed)+N(c.seeds) });
      }catch(e){ res.status(500).json({ error:'server error' }); }
    });

    corn.post('/harvest', async (req,res)=>{
      try{
        const { kakaoId } = req.body||{};
        if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
        const c = await ensureCornDoc(kakaoId);
        const gain = 5 + Math.floor(Math.random()*4); // 5~8
        c.corn = N(c.corn)+gain; await c.save();
        res.json({ ok:true, gain, agri:{ corn:N(c.corn) }});
      }catch(e){ res.status(500).json({ error:'server error' }); }
    });

    corn.post('/pop', async (req,res)=>{
      try{
        const { kakaoId, use } = req.body||{};
        if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
        const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
        const c = await ensureCornDoc(kakaoId);
        if (N(c.corn)<1) return res.status(400).json({ error:'no corn' });

        let pick = use==='sugar'?'sugar':'salt';
        if (N(c.additives?.[pick])<1){
          const other = pick==='salt'?'sugar':'salt';
          if (N(c.additives?.[other])<1) return res.status(400).json({ error:'no additives' });
          pick = other;
        }

        c.corn = N(c.corn)-1; c.additives[pick] = N(c.additives[pick])-1;

        const POP = Math.random() < 0.6;
        let qty;
        if (POP){
          qty = [1,2][Math.floor(Math.random()*2)];
          c.popcorn = N(c.popcorn)+qty;
          user.products = user.products || {};
          user.products.popcorn = N(user.products.popcorn)+qty;
        } else {
          qty = [1,2,3,5][Math.floor(Math.random()*4)];
          user.orcx = N(user.orcx)+qty;
        }
        await Promise.all([c.save(), user.save()]);
        res.json({ ok:true, result: POP?'popcorn':'token', qty,
          wallet:{ orcx:N(user.orcx) }, food:{ popcorn:N(c.popcorn) },
          additives:{ salt:N(c.additives.salt), sugar:N(c.additives.sugar) },
          agri:{ corn:N(c.corn) }
        });
      }catch(e){ res.status(500).json({ error:'server error' }); }
    });

    // exchange
    corn.post('/exchange', async (req,res)=>{
      try{
        const { kakaoId, dir, qty } = req.body||{};
        if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
        const q = Math.max(1, N(qty||1));
        const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
        const c = await ensureCornDoc(kakaoId);
        if (dir==='fertilizer->popcorn'){
          if (N(user.fertilizer)<q) return res.status(400).json({ error:'no fertilizer' });
          user.fertilizer = N(user.fertilizer)-q; c.popcorn = N(c.popcorn)+q;
        } else {
          if (N(c.popcorn)<q) return res.status(400).json({ error:'no popcorn' });
          c.popcorn = N(c.popcorn)-q; user.fertilizer = N(user.fertilizer)+q;
        }
        await Promise.all([user.save(), c.save()]);
        res.json({ ok:true, inventory:{ fertilizer:N(user.fertilizer) }, food:{ popcorn:N(c.popcorn) } });
      }catch(e){ res.status(500).json({ error:'server error' }); }
    });

    // 별칭
    corn.get('/status', (req,res)=>{
      req.url = '/summary' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
      app._router.handle(req,res,()=>res.end());
    });

    router = corn; // 내장 라우터를 최종 router로 지정
  }

  // 3) 최종 장착 (외부 또는 내장)
  app.use('/api/corn', router);
})();













