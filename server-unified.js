// server-unified.js — OrcaX 통합서버 (감자/보리 + 마켓 + 옥수수)
// 다른 파일 수정 없이, 이 파일만으로 복구/운영 가능

require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
let MongoStore = null;
try { MongoStore = require('connect-mongo'); } catch { /* dev fallback */ }
const path = require('path');

// === API 캐시 금지 & ETag 끄기 (마이페이지 304 방지) ===
app.set('etag', false);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// -------------------------------
// 기본 설정
// -------------------------------
const PORT = process.env.PORT || 3060;
const MONGO_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';

// 헬퍼: 선택적 require (없어도 서버 안 죽게)
const optionalRequire = (p) => { try { return require(p); } catch { console.warn(`[skip] ${p} not found`); return null; } };
const noneRouter = () => { const r = express.Router(); r.all('*', (_req,res)=>res.status(204).end()); return r; };
const N = (v) => { v = Number(v); return Number.isFinite(v) ? v : 0; };

// -------------------------------
// Mongo 연결
// -------------------------------
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('✅ MongoDB 연결 성공'))
  .catch(e=>console.error('❌ MongoDB 연결 실패:', e.message));

// -------------------------------
// 미들웨어
// -------------------------------
const allowOrigins = [
  'https://byungil-cho.github.io',
  'https://byungil-cho.github.io/OrcaX',
  'http://localhost:3060',
  'http://localhost:5173',
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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 세션 (connect-mongo 있으면 사용, 없으면 메모리)
const sess = { secret: 'secret-key', resave: false, saveUninitialized: true };
if (MongoStore) { sess.store = MongoStore.create({ mongoUrl: MONGO_URL }); }
else { console.warn('⚠️ connect-mongo 미설치: 메모리 세션으로 동작'); }
app.use(session(sess));

// -------------------------------
// 모델 (감자/보리/마켓 + 옥수수)
// -------------------------------

// 감자/보리 유저 모델: 프로젝트에 원본이 있으면 사용, 없으면 최소 스키마로 대체
let User;
try {
  User = require('./models/users');
} catch {
  console.warn('[warn] ./models/users 없음 — 최소 User 스키마 사용');
  const userSchema = new mongoose.Schema({
    kakaoId: { type: String, unique: true, index: true },
    nickname: String,
    orcx: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    fertilizer: { type: Number, default: 0 },
    seedPotato: { type: Number, default: 0 },
    seedBarley: { type: Number, default: 0 },
    storage: {
      gamja: { type: Number, default: 0 },
      bori:  { type: Number, default: 0 },
    },
    products: { type: Object, default: {} },
    growth: { type: Object, default: {} },
    lastLogin: Date,
  });
  User = mongoose.models.User || mongoose.model('User', userSchema);
}

// 출금/마켓 제품
const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', new mongoose.Schema({
  name: String, email: String, phone: String, wallet: String,
  amount: Number, completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

const MarketProduct = mongoose.models.MarketProduct || mongoose.model('MarketProduct', new mongoose.Schema({
  name: { type: String, unique: true },
  price: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}));

// 옥수수: 전역 1회 선언 (내장/외부 라우터 양쪽에서 공용 사용)
const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId: { type: String, unique: true, index: true },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  seed: { type: Number, default: 0 },
  seeds: { type: Number, default: 0 },
  additives: { salt: { type: Number, default: 0 }, sugar: { type: Number, default: 0 } }
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
async function getPB(){ const s = await CornSettings.findOne(); return s?.priceboard || { salt:10,sugar:20,seed:30,currency:'ORCX' }; }
async function setPB(u){ let s = await CornSettings.findOne(); if(!s) s = await CornSettings.create({}); s.priceboard = { ...(s.priceboard?.toObject?.()||s.priceboard||{}), ...u }; await s.save(); return s.priceboard; }

// -------------------------------
// 라우터 장착 (감자/보리 쪽 — 기존 파일 있으면 그대로 사용)
// -------------------------------
const factoryRoutes     = optionalRequire('./routes/factory')     || noneRouter();
const authRoutes        = optionalRequire('./routes/auth')        || noneRouter();
const userRoutes        = optionalRequire('./routes/user')        || noneRouter();
const userdataV2Routes  = optionalRequire('./routes/userdata_v2') || noneRouter();
const seedRoutes        = optionalRequire('./routes/seed-status') || noneRouter();
const seedBuyRoutes     = optionalRequire('./routes/seed')        || noneRouter();
const initUserRoutes    = optionalRequire('./routes/init-user')   || noneRouter();
const loginRoutes       = optionalRequire('./routes/login')       || noneRouter();
const processingRoutes  = optionalRequire('./routes/processing')  || noneRouter();
const marketdataRoutes  = optionalRequire('./routes/marketdata')  || noneRouter();
const seedPriceRoutes   = optionalRequire('./routes/seed-price')  || noneRouter();

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
app.use('/api/seed',        seedPriceRoutes);

// -------------------------------
/** 헬스체크 */
app.get('/api/health', (_req,res)=>res.json({ ok:true, ts:Date.now() }));
app.get('/api/ping',   (_req,res)=>res.send('pong'));
app.get('/api/power-status', (_req,res)=>{
  const mongoReady = mongoose.connection.readyState === 1;
  res.json({ status: mongoReady ? '정상' : '오류', mongo: mongoReady });
});

// -------------------------------
// 감자/보리 기본 API(필수 보조) — 기존 라우트가 없을 때 동작
// -------------------------------
app.post('/api/withdraw', async (req,res)=>{
  const { nickname, email, phone, wallet, amount } = req.body || {};
  try{
    if (!nickname || !email || !phone || !wallet || isNaN(amount)) {
      return res.json({ success:false, message:'모든 정보를 입력해 주세요.' });
    }
    await Withdraw.create({ name:nickname, email, phone, wallet, amount, createdAt:new Date() });
    res.json({ success:true, message:'출금 신청 완료' });
  }catch{ res.json({ success:false, message:'출금 신청 실패' }); }
});

app.get('/api/userdata/all', async (_req,res)=>{
  try{
    const users = await User.find();
    const list = users.map(u=>({
      nickname: u.nickname,
      kakaoId:  u.kakaoId,
      isConnected: true,
      orcx: N(u.orcx), water: N(u.water), fertilizer: N(u.fertilizer),
      potatoCount: N(u.storage?.gamja), barleyCount: N(u.storage?.bori),
      seedPotato: N(u.seedPotato), seedBarley: N(u.seedBarley),
    }));
    res.json(list);
  }catch{ res.status(500).json({ error:'DB 오류' }); }
});

// /api/userdata (GET/POST 겸용) — 프론트 필수 응답 보장
app.use('/api/userdata', express.json(), (req,_res,next)=>{
  if (req.method==='GET' || req.method==='POST') {
    req.body = req.body || {};
    if (!req.body.kakaoId  && req.query?.kakaoId)  req.body.kakaoId  = req.query.kakaoId;
    if (!req.body.nickname && req.query?.nickname) req.body.nickname = req.query.nickname;
  }
  next();
});

async function packUserResponse(user){
  const corn = await ensureCornDoc(user.kakaoId);
  const seedSum = N(corn.seed) + N(corn.seeds);
  return {
    success: true,
    user: {
      nickname: user.nickname,
      inventory: {
        water: N(user.water),
        fertilizer: N(user.fertilizer),
        seedPotato: N(user.seedPotato),
        seedBarley: N(user.seedBarley),
      },
      orcx: N(user.orcx),
      wallet: { orcx: N(user.orcx) },
      potato: N(user.storage?.gamja),
      barley: N(user.storage?.bori),
      growth: user.growth || {},
      // 옥수수 동봉(프론트가 써도 OK, 안 써도 무방)
      agri:      { corn: N(corn.corn), seedCorn: seedSum },
      additives: { salt: N(corn.additives?.salt), sugar: N(corn.additives?.sugar) },
      food:      { popcorn: N(corn.popcorn) },
    }
  };
}

app.post('/api/userdata', async (req,res)=>{
  try{
    const { kakaoId, nickname } = req.body || {};
    if (!kakaoId && !nickname) return res.json({ success:false, needLogin:true });
    const query = kakaoId ? { kakaoId } : { nickname };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json(await packUserResponse(user));
  }catch(e){
    console.error('[POST /api/userdata] error:', e); res.status(500).json({ success:false, message:'서버 오류' });
  }
});

app.get('/api/userdata', async (req,res)=>{
  try{
    const kakaoId  = req.query?.kakaoId  || req.body?.kakaoId  || null;
    const nickname = req.query?.nickname || req.body?.nickname || null;
    if (!kakaoId && !nickname) return res.json({ success:false, needLogin:true });
    const user = await User.findOne(kakaoId ? { kakaoId } : { nickname });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json(await packUserResponse(user));
  }catch(e){
    console.error('[GET /api/userdata] error:', e); res.status(500).json({ success:false, message:'서버 오류' });
  }
});

// -------------------------------
// 마켓 — 레거시 호환(경로/응답 동일)
// -------------------------------
async function activePriceList(){
  const items = await MarketProduct.find({ active:true, amount: { $gt: 0 } }).lean();
  return (items||[]).map(it=>({ name:it.name, price:N(it.price), amount:N(it.amount), active:!!it.active }));
}
app.get('/api/market/price-board', async (_req,res)=>{
  try { res.json({ success:true, priceList: await activePriceList() }); }
  catch(e){ console.error('[market/price-board]', e); res.status(500).json({ success:false }); }
});
app.get('/api/market/prices', async (_req,res)=>{
  try { res.json({ success:true, priceList: await activePriceList() }); }
  catch{ res.status(500).json({ success:false }); }
});
app.get('/api/marketdata/products', async (_req,res)=>{
  try { const list = await MarketProduct.find({}).lean(); res.json({ success:true, products:list }); }
  catch{ res.status(500).json({ success:false, products:[] }); }
});
app.post('/api/marketdata/products/bulk', async (req,res)=>{
  try{
    const items = req.body?.items || [];
    const ops = items.map(async it=>{
      const { name, price, amount } = it;
      let doc = await MarketProduct.findOne({ name });
      if (!doc) doc = await MarketProduct.create({ name, price:N(price), amount:N(amount), active:true });
      else { doc.price = N(price ?? doc.price); doc.amount = N(amount ?? doc.amount); doc.active = true; await doc.save(); }
      return doc;
    });
    await Promise.all(ops);
    const products = await MarketProduct.find({}).lean();
    res.json({ success:true, products });
  }catch(e){ console.error('[products/bulk]', e); res.status(500).json({ success:false }); }
});
app.post('/api/market/sell', async (req,res)=>{
  try{
    const { kakaoId, item, qty } = req.body || {};
    if(!kakaoId || !item) return res.status(400).json({ success:false, message:'params' });
    const q = Math.max(1, N(qty));
    const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ success:false, message:'user' });
    const prod = await MarketProduct.findOne({ name:item, active:true }); if(!prod || N(prod.amount) < q) return res.status(400).json({ success:false, message:'out of stock' });

    user.products = user.products || {};
    const cur = N(user.products[item]); if (cur < q) return res.status(400).json({ success:false, message:'no item' });

    const gain = N(prod.price) * q;
    user.products[item] = cur - q;
    prod.amount = N(prod.amount) - q;
    user.orcx = N(user.orcx) + gain;
    await Promise.all([user.save(), prod.save()]);
    res.json({ success:true, wallet:{ orcx:N(user.orcx) }, products:user.products, sold:{ item, qty:q, gain } });
  }catch(e){ console.error('[market/sell]', e); res.status(500).json({ success:false }); }
});
app.post('/api/market/exchange', async (req,res)=>{
  try{
    const { kakaoId, item, qty, to } = req.body || {};
    if(!kakaoId || !item || !to) return res.status(400).json({ success:false });
    const q = Math.max(1, N(qty));
    const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ success:false });
    user.products = user.products || {};
    const cur = N(user.products[item]); if (cur < q) return res.status(400).json({ success:false, message:'no item' });

    const ratio = 3, give = q * ratio;
    if (to === 'water')      { user.products[item] = cur - q; user.water      = N(user.water)      + give; }
    else if (to === 'fertilizer') { user.products[item] = cur - q; user.fertilizer = N(user.fertilizer) + give; }
    else return res.status(400).json({ success:false, message:'to must be water|fertilizer' });

    await user.save();
    res.json({ success:true, inventory:{ water:N(user.water), fertilizer:N(user.fertilizer) }, products:user.products });
  }catch(e){ console.error('[market/exchange]', e); res.status(500).json({ success:false }); }
});
// === Market: user inventory (legacy endpoint for gamja pages) ===
// 프론트가 POST를 쓰지만 GET도 허용해 둡니다.
app.all('/api/market/user-inventory', async (req, res) => {
  try {
    const kakaoId = (req.body && req.body.kakaoId) || (req.query && req.query.kakaoId);
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success:false, message:'user not found' });

    const products = user.products || {};
    return res.json({
      success: true,
      products,                                         // 내 제품 보관함
      inventory: { water: N(user.water), fertilizer: N(user.fertilizer) },
      wallet:    { orcx:  N(user.orcx) }
    });
  } catch (e) {
    console.error('[market/user-inventory]', e);
    return res.status(500).json({ success:false });
  }
});
// === Fallback: /api/processing/get-inventory (없는 방에서만 효과) ===
app.post('/api/processing/get-inventory', async (req, res, next) => {
  const kakaoId = req.body && req.body.kakaoId;
  if (!kakaoId) return next(); // 기존 라우터가 있으면 그쪽으로
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success:false });
    return res.json({
      success: true,
      inventory: {
        water: N(user.water), fertilizer: N(user.fertilizer),
        potato: N(user.storage?.gamja), barley: N(user.storage?.bori),
        seedPotato: N(user.seedPotato), seedBarley: N(user.seedBarley),
      },
      products: user.products || {}
    });
  } catch { return res.status(500).json({ success:false }); }
});
// === Legacy: My Page profile endpoint for gamja (304 방지: 항상 200+JSON) ===
app.get('/api/user/profile/:key', async (req, res) => {
  try {
    let key = decodeURIComponent(req.params.key || '').trim();
    if (!key) return res.status(400).json({ success:false, message:'key required' });

    let user = await User.findOne({ $or: [{ kakaoId:key }, { nickname:key }] });
    if (!user && /\s/.test(key)) {
      user = await User.findOne({ nickname: key.replace(/\s+/g, '') });
    }
    if (!user) return res.status(404).json({ success:false, message:'User not found' });

    return res.status(200).json(await packUserResponse(user)); // ⬅ 200 고정
  } catch (e) {
    console.error('[GET /api/user/profile/:key]', e);
    return res.status(500).json({ success:false, message:'server error' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const kakaoId  = req.query?.kakaoId  || null;
    const nickname = req.query?.nickname || null;
    if (!kakaoId && !nickname) return res.status(400).json({ success:false, message:'kakaoId or nickname required' });

    let user = await User.findOne(kakaoId ? { kakaoId } : { nickname });
    if (!user && nickname && /\s/.test(nickname)) {
      user = await User.findOne({ nickname: nickname.replace(/\s+/g, '') });
    }
    if (!user) return res.status(404).json({ success:false, message:'User not found' });

    return res.status(200).json(await packUserResponse(user)); // ⬅ 200 고정
  } catch (e) {
    console.error('[GET /api/user/profile]', e);
    return res.status(500).json({ success:false, message:'server error' });
  }
});

// -------------------------------
// 옥수수 엔진 — 외부가 있으면 우선 장착, 없으면 내장 제공
// -------------------------------
(() => {
  // 1) 외부 엔진 시도
  const tryPaths = ['./routes/corn','./corn','./engine/corn','./corn-engine','./api/corn'];
  for (const p of tryPaths){
    try {
      const mod = require(p);
      const ext = mod.default || mod;
      if (typeof ext === 'function') {
        app.use('/api/corn', ext);
        console.log('🌽 External corn engine attached at /api/corn from', p);
        return;
      }
    } catch { /* continue */ }
  }
  console.log('🌽 External corn engine not found. Using built-in engine.');

  // 2) 내장 라우터
  const corn = express.Router();

  // 공통 파싱
  corn.use((req,_res,next)=>{
    if (!req.body) req.body = {};
    if (!req.body.kakaoId && req.query?.kakaoId) req.body.kakaoId = req.query.kakaoId;
    next();
  });

  // summary
  corn.get('/summary', async (req,res)=>{
    try{
      const kakaoId = req.query?.kakaoId;
      if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ ok:false, error:'user not found' });
      const c = await ensureCornDoc(kakaoId);
      const seeds = N(c.seed) + N(c.seeds);
      res.json({
        ok:true,
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
    const { salt, sugar, seed, currency } = req.body || {};
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
      let { kakaoId, item, qty } = req.body || {};
      if(!kakaoId || !item) return res.status(400).json({ error:'params' });
      qty = Math.max(1, N(qty));
      if (item==='seeds') item='seed';
      if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error:'item' });

      const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
      const pb = await getPB();
      const unit = item==='salt'?pb.salt:item==='sugar'?pb.sugar:pb.seed;
      const need = unit * qty;
      if (N(user.orcx) < need) return res.status(402).json({ error:'ORCX 부족' });

      const c = await ensureCornDoc(kakaoId);
      user.orcx = N(user.orcx) - need;
      if (item==='seed') c.seed = N(c.seed) + qty;
      else { c.additives = c.additives || {}; c.additives[item] = N(c.additives[item]) + qty; }

      await Promise.all([user.save(), c.save()]);
      res.json({ ok:true, wallet:{ orcx:N(user.orcx) }, additives:c.additives, agri:{ seeds: N(c.seed)+N(c.seeds) } });
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

  // plant
  corn.post('/plant', async (req,res)=>{
    try{
      const { kakaoId } = req.body || {};
      if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const c = await ensureCornDoc(kakaoId);
      const total = N(c.seed)+N(c.seeds);
      if (total < 1) return res.status(400).json({ error:'no seeds' });
      if (N(c.seed)>0) c.seed = N(c.seed) - 1; else c.seeds = Math.max(0, N(c.seeds) - 1);
      await c.save();
      res.json({ ok:true, seeds: N(c.seed)+N(c.seeds) });
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

  // harvest
  corn.post('/harvest', async (req,res)=>{
    try{
      const { kakaoId } = req.body || {};
      if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const c = await ensureCornDoc(kakaoId);
      const gain = 5 + Math.floor(Math.random()*4); // 5~8
      c.corn = N(c.corn) + gain; await c.save();
      res.json({ ok:true, gain, agri:{ corn:N(c.corn) } });
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

  // pop (popcorn or token)
  corn.post('/pop', async (req,res)=>{
    try{
      const { kakaoId, use } = req.body || {};
      if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
      const c = await ensureCornDoc(kakaoId);
      if (N(c.corn) < 1) return res.status(400).json({ error:'no corn' });

      let pick = use === 'sugar' ? 'sugar' : 'salt';
      if (N(c.additives?.[pick]) < 1) {
        const other = pick === 'salt' ? 'sugar' : 'salt';
        if (N(c.additives?.[other]) < 1) return res.status(400).json({ error:'no additives' });
        pick = other;
      }

      c.corn = N(c.corn) - 1;
      c.additives[pick] = N(c.additives[pick]) - 1;

      const POP = Math.random() < 0.6;
      let qty;
      if (POP) {
        qty = [1,2][Math.floor(Math.random()*2)];
        c.popcorn = N(c.popcorn) + qty;
        user.products = user.products || {};
        user.products.popcorn = N(user.products.popcorn) + qty; // 감자 마켓 호환
      } else {
        qty = [1,2,3,5][Math.floor(Math.random()*4)];
        user.orcx = N(user.orcx) + qty;
      }

      await Promise.all([c.save(), user.save()]);
      res.json({
        ok:true, result: POP ? 'popcorn' : 'token', qty,
        wallet:{ orcx:N(user.orcx) }, food:{ popcorn:N(c.popcorn) },
        additives:{ salt:N(c.additives.salt), sugar:N(c.additives.sugar) },
        agri:{ corn:N(c.corn) }
      });
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

  // exchange
  corn.post('/exchange', async (req,res)=>{
    try{
      const { kakaoId, dir, qty } = req.body || {};
      if(!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const q = Math.max(1, N(qty || 1));
      const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
      const c = await ensureCornDoc(kakaoId);

      if (dir === 'fertilizer->popcorn') {
        if (N(user.fertilizer) < q) return res.status(400).json({ error:'no fertilizer' });
        user.fertilizer = N(user.fertilizer) - q; c.popcorn = N(c.popcorn) + q;
      } else {
        if (N(c.popcorn) < q) return res.status(400).json({ error:'no popcorn' });
        c.popcorn = N(c.popcorn) - q; user.fertilizer = N(user.fertilizer) + q;
      }

      await Promise.all([user.save(), c.save()]);
      res.json({ ok:true, inventory:{ fertilizer:N(user.fertilizer) }, food:{ popcorn:N(c.popcorn) } });
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

  // 별칭
  corn.get('/status', (req,res)=>{
    req.url = '/summary' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    app._router.handle(req, res, ()=>res.end());
  });

  app.use('/api/corn', corn);
})();

// -------------------------------
// 서버 시작
// -------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


















