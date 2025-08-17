// server-unified.js — OrcaX 통합 서버 (옥수수 전용 패치 포함)
// ✅ 핵심: seed/seeds 혼용 완전 해결, 구매·심기 라우트에서 일관 처리, summary에 항상 seeds 포함

require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// ===== 사용자 모델 (기존 경로 사용) =====
const User = require('./models/users');

// ===== (옵션) 기타 모델/라우터 안전 로드 =====
function safeRequire(p){ try { return require(p); } catch { return (req,res,next)=>next(); } }
const factoryRoutes    = safeRequire('./routes/factory');
const authRoutes       = safeRequire('./routes/auth');
const userRoutes       = safeRequire('./routes/user');
const userdataV2Routes = safeRequire('./routes/userdata_v2');
const seedRoutes       = safeRequire('./routes/seed-status');
const seedBuyRoutes    = safeRequire('./routes/seed');
const initUserRoutes   = safeRequire('./routes/init-user');
const loginRoutes      = safeRequire('./routes/login');
const processingRoutes = safeRequire('./routes/processing');
const marketdataRoutes = safeRequire('./routes/marketdata');
const marketRoutes     = safeRequire('./routes/marketdata');
const seedPriceRoutes  = safeRequire('./routes/seed-price');

// ===== Mongo 연결 =====
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

// ===== 옥수수 전용 스키마 (seed/seeds 동시 지원) =====
const CornSchema = new mongoose.Schema({
  kakaoId: { type: String, index: true, unique: true },
  corn:    { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
  },
  // 과거/신규 호환을 위해 둘 다 보유
  seed:    { type: Number, default: 0 },
  seeds:   { type: Number, default: 0 },
}, { collection: 'corn_data' });

// 저장 직전 seed/seeds 동기화
CornSchema.pre('save', function(next){
  const a = Number.isFinite(+this.seeds) ? +this.seeds : 0;
  const b = Number.isFinite(+this.seed)  ? +this.seed  : 0;
  const v = Math.max(a, b);
  this.seed  = v;
  this.seeds = v;
  if (!this.additives) this.additives = { salt:0, sugar:0 };
  next();
});

const CornSettingsSchema = new mongoose.Schema({
  priceboard: {
    salt: { type: Number, default: 10 },
    sugar:{ type: Number, default: 20 },
    seed: { type: Number, default: 30 },
    currency: { type: String, default: 'ORCX' }
  }
}, { collection: 'corn_settings' });

const CornData     = mongoose.models.CornData     || mongoose.model('CornData', CornSchema);
const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', CornSettingsSchema);

// ===== 미들웨어 =====
const allowOrigins = [
  'https://byungil-cho.github.io',
  'https://byungil-cho.github.io/OrcaX',
  'http://localhost:3060','http://localhost:5173'
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
    } catch { return cb(null, false); }
  },
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}));
app.options('*', cors());

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 세션(필요 시)
app.use(session({
  secret: 'orcax-secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl })
}));

// ===== 공용 헬스 =====
app.get('/api/ping',   (_,res)=>res.send('pong'));
app.get('/api/health', (_,res)=>res.json({ ok:true, ts:Date.now() }));

// ===== 공용 헬퍼 =====
const N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
async function ensureCornDoc(kakaoId){
  let doc = await CornData.findOne({ kakaoId });
  if (!doc) doc = await CornData.create({ kakaoId });
  if (!doc.additives) doc.additives = { salt:0, sugar:0 };
  if (doc.seeds == null) doc.seeds = N(doc.seed);
  if (doc.seed  == null) doc.seed  = N(doc.seeds);
  return doc;
}
const getSeeds = (doc) => N(doc?.seeds ?? doc?.seed);
const setSeeds = (doc, v) => { const n=N(v); doc.seeds=n; doc.seed=n; };

async function getPriceboard(){
  const doc = await CornSettings.findOne();
  return (doc?.priceboard) || { salt:10, sugar:20, seed:30, currency:'ORCX' };
}
async function setPriceboard(update){
  let doc = await CornSettings.findOne();
  if (!doc) doc = await CornSettings.create({});
  doc.priceboard = { ...(doc.priceboard?.toObject?.() || doc.priceboard || {}), ...update };
  await doc.save();
  return doc.priceboard;
}

// ===== 기존 라우터 장착(있으면 작동) =====
app.use('/api/factory',     factoryRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/user',        userRoutes);
app.use('/api/user/v2data', userdataV2Routes);
app.use('/api/seed',        seedRoutes);
app.use('/api/seed',        seedBuyRoutes);
app.use('/api/init-user',   initUserRoutes);
app.use('/api/login',       loginRoutes);
app.use('/api/processing',  processingRoutes);
app.use('/api/marketdata',  marketdataRoutes);
app.use('/api/market',      marketRoutes);
app.use('/api/seed',        seedPriceRoutes);

// ===== 정규화 미들웨어: 프런트가 'seeds'로 보내면 'seed'로 표준화 =====
app.use('/api/corn/buy-additive', (req, _res, next) => {
  try { if (req.method === 'POST' && req.body?.item === 'seeds') req.body.item = 'seed'; } catch {}
  next();
});

// ===== 유저 데이터 (공유 자원 + corn 일부) =====
app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body || {};
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId is required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });

    // corn 스냅샷(씨앗도 포함해서 주기)
    const corn = await ensureCornDoc(kakaoId);

    res.json({
      success:true,
      user: {
        kakaoId, nickname: user.nickname || nickname,
        inventory: { water:N(user.water), fertilizer:N(user.fertilizer) },
        wallet: { orcx:N(user.orcx) }, orcx: N(user.orcx),

        // corn 전용
        agri: { corn:N(corn.corn), seedCorn:getSeeds(corn) },
        additives: { salt:N(corn.additives?.salt), sugar:N(corn.additives?.sugar) },
        food: { popcorn:N(corn.popcorn) },
      }
    });
  } catch(e){
    console.error('userdata error', e);
    res.status(500).json({ success:false, message:'서버 오류' });
  }
});

// ===== 가격보드 =====
app.get('/api/corn/priceboard', async (_req,res)=>{
  try { res.json(await getPriceboard()); }
  catch{ res.status(500).json(await getPriceboard()); }
});
app.patch('/api/corn/priceboard', async (req,res)=>{
  try{
    const { salt, sugar, seed, currency } = req.body || {};
    const next = {};
    if (Number.isFinite(salt))  next.salt = Number(salt);
    if (Number.isFinite(sugar)) next.sugar = Number(sugar);
    if (Number.isFinite(seed))  next.seed = Number(seed);
    if (currency)               next.currency = String(currency);
    res.json(await setPriceboard(next));
  }catch{
    res.status(500).json(await getPriceboard());
  }
});

// ===== corn summary =====
app.get('/api/corn/summary', async (req, res) => {
  try {
    const kakaoId = req.query?.kakaoId || req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ ok:false, error:'User not found' });

    const corn = await ensureCornDoc(kakaoId);

    res.json({
      ok:true,
      wallet:   { orcx:N(user.orcx) },
      inventory:{ water:N(user.water), fertilizer:N(user.fertilizer) },
      agri:     { corn:N(corn.corn), seeds:getSeeds(corn) }, // ★ 항상 seeds로 통일
      additives:{ salt:N(corn.additives?.salt), sugar:N(corn.additives?.sugar) },
      food:     { popcorn:N(corn.popcorn) }
    });
  } catch(e){
    console.error('summary error', e);
    res.status(500).json({ ok:false, error:'server error' });
  }
});

// ===== 구매: salt/sugar/seed =====
app.post('/api/corn/buy-additive', async (req, res) => {
  try {
    const { kakaoId, item, qty } = req.body || {};
    const q = Math.max(1, Number(qty || 1));
    if (!kakaoId || !['salt','sugar','seed'].includes(item)) {
      return res.status(400).json({ error: 'kakaoId, item(salt|sugar|seed) 필요' });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'User not found' });

    const price = await getPriceboard();
    const unit  = item === 'salt' ? price.salt : item === 'sugar' ? price.sugar : price.seed;
    const need  = unit * q;
    if (N(user.orcx) < need) return res.status(402).json({ error:'토큰 부족' });

    const corn = await ensureCornDoc(kakaoId);
    user.orcx = N(user.orcx) - need;

    if (item === 'seed') {
      setSeeds(corn, getSeeds(corn) + q); // ★ 씨앗은 최상위 seed/seeds 동시 반영
    } else {
      corn.additives[item] = N(corn.additives[item]) + q;
    }

    await Promise.all([user.save(), corn.save()]);

    return res.json({
      ok:true,
      wallet:{ orcx:N(user.orcx) },
      agri:{ seeds:getSeeds(corn), corn:N(corn.corn) },
      additives:{ salt:N(corn.additives.salt), sugar:N(corn.additives.sugar) },
      food:{ popcorn:N(corn.popcorn) }
    });
  } catch(e){
    console.error('buy-additive error', e);
    res.status(500).json({ error:'server error' });
  }
});

// ===== 심기: seed 1 감소 =====
app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error:'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    const s = getSeeds(corn);
    if (s < 1) return res.status(400).json({ error:'씨앗 부족' });
    setSeeds(corn, s - 1);
    await corn.save();
    res.json({ ok:true, agri:{ seeds:getSeeds(corn) } });
  } catch(e){
    console.error('plant error', e);
    res.status(500).json({ error:'server error' });
  }
});

// ===== (참고) 수확/뻥튀기/교환 — 기존 게임 로직 유지 =====
app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error:'kakaoId 필요' });
    const corn = await ensureCornDoc(kakaoId);
    const gain = 5 + Math.floor(Math.random()*4);
    corn.corn = N(corn.corn) + gain;
    await corn.save();
    res.json({ ok:true, agri:{ corn:N(corn.corn) }, gain });
  } catch(e){ res.status(500).json({ error:'server error' }); }
});

// (옵션) 팝 생산
app.post('/api/corn/pop', async (req, res) => {
  try {
    const { kakaoId, use } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error:'kakaoId 필요' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error:'User not found' });
    const corn = await ensureCornDoc(kakaoId);
    if (N(corn.corn) < 1) return res.status(400).json({ error:'옥수수 부족' });

    let pick = use === 'sugar' ? 'sugar' : 'salt';
    if (N(corn.additives[pick]) < 1) {
      const other = pick === 'salt' ? 'sugar' : 'salt';
      if (N(corn.additives[other]) < 1) return res.status(400).json({ error:'첨가물 부족' });
      pick = other;
    }

    corn.corn = N(corn.corn) - 1;
    corn.additives[pick] = N(corn.additives[pick]) - 1;

    const POP_RATE = 0.6; const TOKEN_DROP=[1,2,3,5]; const POP_DROP=[1,2];
    const rnd = arr => arr[Math.floor(Math.random()*arr.length)];
    let result, qty;
    if (Math.random() < POP_RATE) {
      qty = rnd(POP_DROP);
      corn.popcorn = N(corn.popcorn) + qty;
      result = 'popcorn';
    } else {
      qty = rnd(TOKEN_DROP);
      user.orcx = N(user.orcx) + qty;
      result = 'token';
    }

    await Promise.all([user.save(), corn.save()]);
    res.json({
      ok:true, result, qty,
      wallet:{ orcx:N(user.orcx) },
      agri:{ corn:N(corn.corn), seeds:getSeeds(corn) },
      additives:{ salt:N(corn.additives.salt), sugar:N(corn.additives.sugar) },
      food:{ popcorn:N(corn.popcorn) }
    });
  } catch(e){ res.status(500).json({ error:'server error' }); }
});

// ===== 서버 시작 =====
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
