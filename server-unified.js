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

// ====== (신규) 옥수수: 가격보드 ======
async function getPriceboard() {
  const doc = await CornSettings.findOne();
  return (doc?.priceboard) || { salt: 10, sugar: 20, seed: 30, currency: 'ORCX' };
}
async function setPriceboard(update) {
  let doc = await CornSettings.findOne();
  if (!doc) doc = await CornSettings.create({});
  const cur = (doc.priceboard && doc.priceboard.toObject?.()) || doc.priceboard || {};
  doc.priceboard = { ...cur, ...update };
  await doc.save();
  return doc.priceboard;
}

app.get('/api/corn/priceboard', async (req, res) => {
  try { res.json(await getPriceboard()); }
  catch { res.status(500).json({ salt: 10, sugar: 20, seed: 30, currency: 'ORCX' }); }
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

// ====== (신규) 옥수수: 구매/심기/수확/뻥튀기 ======
app.post('/api/corn/buy-additive', async (req, res) => {
  try {
    const body = req.body || {};
    const kakaoId = body.kakaoId;
    let item = body.item || body.type;
    const q = Math.max(1, Number(body.qty ?? body.amount ?? 1));
    if (!kakaoId || !item) return res.status(400).json({ error: 'kakaoId,item 필요' });

    // item 표준화
    if (item === 'seeds') item = 'seed';
    if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error: 'unknown item' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const price = await getPriceboard();
    const unit  = item === 'salt' ? price.salt : item === 'sugar' ? price.sugar : price.seed;
    const need  = unit * q;

    if (_N(user.orcx) < need) return res.status(402).json({ error: '토큰 부족' });

    // 차감
    user.orcx = _N(user.orcx) - need;

    // corn_data 증가
    const corn = await ensureCornDoc(kakaoId);
    if (item === 'seed') {
      corn.seed = _N(corn.seed) + q;     // 단일 seed 필드 증가
    } else {
      corn.additives = corn.additives || {};
      corn.additives[item] = _N(corn.additives[item]) + q;
    }

    await user.save();
    await corn.save();

    return res.json({
      ok: true,
      wallet: { orcx: _N(user.orcx) },
      agri: { seeds: _N(corn.seed) },
      additives: { salt: _N(corn.additives?.salt), sugar: _N(corn.additives?.sugar) }
    });
  } catch (e) {
    console.error('[buy-additive]', e);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    const cur = _N(corn.seed) + _N(corn.seeds);
    if (cur < 1) return res.status(400).json({ error: '씨앗 부족' });
    // seed 필드 우선 차감
    if (_N(corn.seed) > 0) corn.seed = _N(corn.seed) - 1;
    else corn.seeds = Math.max(0, _N(corn.seeds) - 1);
    await corn.save();
    res.json({ ok: true, seeds: _N(corn.seed) + _N(corn.seeds) });
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
    corn.corn = _N(corn.corn) + gain;
    await corn.save();

    res.json({ gain, agri: { corn: _N(corn.corn) } });
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
    if (_N(corn.corn) < 1) return res.status(400).json({ error: '옥수수 부족' });

    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if (_N(corn.additives?.[pick]) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if (_N(corn.additives?.[other]) < 1) {
        return res.status(400).json({ error: '첨가물 부족' });
      }
      pick = other;
    }

    // 차감
    corn.corn = _N(corn.corn) - 1;
    corn.additives[pick] = _N(corn.additives[pick]) - 1;

    // 60% 팝콘, 40% 토큰
    const POP_RATE = 0.6;
    const TOKEN_DROP = [1,2,3,5];
    const POP_DROP = [1,2];
    const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

    let result, qty;
    if (Math.random() < POP_RATE) {
      qty = rnd(POP_DROP);
      corn.popcorn = _N(corn.popcorn) + qty;

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

/* ===== CORN ROUTER ATTACH (ADD-ONLY) =====
   외부 corn 라우터가 있을 경우 /api/corn 에 자동 장착 (없으면 경고만)
*/
(function attachCornRouter(appRef){
  try {
    if (!appRef.locals) appRef.locals = {};
    if (appRef.locals.__CORN_ROUTER_ATTACHED__) return;
    const tryPaths = [
      './routes/corn',
      './routes/corn.js',
      './router/corn',
      './api/corn',
      './routers/corn',
      './routes/corn'
    ];
    let mod = null, errLast = null;
    for (const p of tryPaths) {
      try { mod = require(p); break; }
      catch (e) { errLast = e; mod = null; }
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







