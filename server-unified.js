/**
 * OrcaX Unified Server
 * - 감자/보리 기존 프론트 호환 API 유지
 * - 옥수수 엔진 모듈 자동 연동 (routes/corn.js 있으면 우선 사용)
 * - 모듈이 없으면 내장 Corn 엔진으로 동작
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const mongoose = require('mongoose');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3060;

/* -------------------- Middlewares -------------------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

// CORS (GitHub Pages / 로컬 허용)
const allow = (process.env.ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allow.length === 0 || allow.some(a => origin.startsWith(a))) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

/* -------------------- Mongo -------------------- */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orcax';
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI).then(() => {
  console.log('✅ Mongo connected');
}).catch(err => {
  console.error('❌ Mongo connect failed:', err.message);
});

/* -------------------- Models -------------------- */
function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const UserSchema = new mongoose.Schema({
    kakaoId: { type: String, unique: true, index: true },
    nickname: { type: String, default: 'Guest' },
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
    growth:   { type: Object, default: {} },
    lastLogin: Date,
  }, { collection: 'users' });
  return mongoose.model('User', UserSchema);
}

function getCornDataModel() {
  if (mongoose.models.CornData) return mongoose.models.CornData;
  const CornSchema = new mongoose.Schema({
    kakaoId:  { type: String, unique: true, index: true },
    corn:     { type: Number, default: 0 },
    popcorn:  { type: Number, default: 0 },
    seed:     { type: Number, default: 0 },
    seeds:    { type: Number, default: 0 },
    additives: {
      salt:  { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },
  }, { collection: 'corn_data' });
  return mongoose.model('CornData', CornSchema);
}

function getCornSettingsModel() {
  if (mongoose.models.CornSettings) return mongoose.models.CornSettings;
  const S = new mongoose.Schema({
    priceboard: {
      salt:     { type: Number, default: 10 },
      sugar:    { type: Number, default: 20 },
      seed:     { type: Number, default: 30 },
      currency: { type: String,  default: 'ORCX' },
    }
  }, { collection: 'corn_settings' });
  return mongoose.model('CornSettings', S);
}

const User         = getUserModel();
const CornData     = getCornDataModel();
const CornSettings = getCornSettingsModel();

/* -------------------- Helpers -------------------- */
const N = v => Number.isFinite(+v) ? +v : 0;

async function ensureCornDoc(kakaoId) {
  let d = await CornData.findOne({ kakaoId });
  if (d) return d;
  try { return await CornData.create({ kakaoId }); }
  catch { return await CornData.findOne({ kakaoId }); }
}

async function getPB() {
  const s = await CornSettings.findOne();
  return s?.priceboard || { salt:10, sugar:20, seed:30, currency:'ORCX' };
}
async function setPB(u) {
  let s = await CornSettings.findOne();
  if (!s) s = await CornSettings.create({});
  s.priceboard = { ...(s.priceboard?.toObject?.() || s.priceboard || {}), ...u };
  await s.save();
  return s.priceboard;
}

/* -------------------- Health -------------------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* -------------------- init-user (겸용, GET/POST) -------------------- */
async function upsertAll(kakaoId, nickname) {
  // users
  let user = await User.findOne({ kakaoId });
  if (!user) {
    user = await User.create({ kakaoId, nickname: nickname || 'Guest', lastLogin: new Date() });
  } else {
    if (nickname && user.nickname !== nickname) user.nickname = nickname;
    user.lastLogin = new Date();
    await user.save();
  }
  // corn_data
  await ensureCornDoc(kakaoId);
  return { kakaoId: user.kakaoId, nickname: user.nickname };
}

app.get('/api/init-user', async (req, res) => {
  try {
    const kakaoId  = req.query.kakaoId || req.body?.kakaoId;
    const nickname = req.query.nickname || req.body?.nickname || 'Guest';
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
    const r = await upsertAll(kakaoId, nickname);
    res.json({ success:true, ...r });
  } catch (e) {
    console.error('[GET /api/init-user]', e);
    res.status(500).json({ success:false });
  }
});

app.post('/api/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname='Guest' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
    const r = await upsertAll(kakaoId, nickname);
    res.json({ success:true, ...r });
  } catch (e) {
    console.error('[POST /api/init-user]', e);
    res.status(500).json({ success:false });
  }
});

/* -------------------- 감자/보리 호환용 라이트 API -------------------- */
// 로그인 펄스용
app.all('/api/login', (_req, res) => res.status(200).json({ ok:true }));

// 사용자 데이터 저장/조회 (프론트가 임의 정보 저장하는 용도)
app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId, nickname, ...rest } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const user = await User.findOne({ kakaoId }) || await User.create({ kakaoId, nickname:nickname||'Guest' });
    if (nickname) user.nickname = nickname;
    // 허용 필드만 업데이트
    ['orcx','water','fertilizer','seedPotato','seedBarley','storage','products','growth']
      .forEach(k => { if (k in rest) user[k] = rest[k]; });
    await user.save();
    res.json({ ok:true });
  } catch (e) {
    console.error('[POST /api/userdata]', e);
    res.status(500).json({ ok:false });
  }
});

app.get('/api/user/profile/:nickname', async (req, res) => {
  try {
    const u = await User.findOne({ nickname: req.params.nickname });
    if (!u) return res.status(404).json({ ok:false, message:'not found' });
    res.json({
      ok:true,
      profile:{
        kakaoId:u.kakaoId, nickname:u.nickname, orcx:N(u.orcx),
        water:N(u.water), fertilizer:N(u.fertilizer),
        storage:u.storage||{}, products:u.products||{}
      }
    });
  } catch (e) {
    console.error('[GET /api/user/profile/:nickname]', e);
    res.status(500).json({ ok:false });
  }
});

// 재고 조회 (감자/보리 페이지에서 쓰는 최소셋)
app.post('/api/processing/get-inventory', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const u = await User.findOne({ kakaoId });
    if (!u) return res.status(404).json({ ok:false, message:'user not found' });
    res.json({
      ok:true,
      inventory:{
        water: N(u.water),
        fertilizer: N(u.fertilizer),
        potatoSeeds: N(u.seedPotato),
        barleySeeds: N(u.seedBarley),
        storage: u.storage || {}
      },
      wallet:{ orcx: N(u.orcx) }
    });
  } catch (e) {
    console.error('[POST /api/processing/get-inventory]', e);
    res.status(500).json({ ok:false });
  }
});

// 마켓 가격판 (304 가능하도록 헤더 세팅)
const MARKET_PB = { salt:10, sugar:20, seed:30, currency:'ORCX' };
let MARKET_LM = new Date();
app.get('/api/market/price-board', (req, res) => {
  res.set('Cache-Control','public, max-age=60');
  res.set('Last-Modified', MARKET_LM.toUTCString());
  res.json(MARKET_PB);
});

/* -------------------- Corn 외부 모듈 우선 장착 -------------------- */
let __cornAttached = false;
try {
  const ext = require('./routes/corn'); // 있으면 외부 모듈 우선
  app.use('/api/corn', (ext.default || ext));
  __cornAttached = true;
  console.log('🌽 External corn engine attached at /api/corn');
} catch (_e) {
  console.log('🌽 External corn engine not found, fallback to built-in');
}

/* -------------------- Corn 내장 라우터 (외부 없을 때만) -------------------- */
if (!__cornAttached) {
  const corn = express.Router();

  corn.get('/summary', async (req, res) => {
    try{
      const kakaoId = req.query.kakaoId;
      if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const user = await User.findOne({ kakaoId });
      if(!user) return res.status(404).json({ ok:false, error:'user not found' });
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

  corn.post('/buy-additive', async (req,res)=>{
    try{
      let { kakaoId, item, qty } = req.body||{};
      if(!kakaoId || !item) return res.status(400).json({ error:'params' });
      qty = Math.max(1, N(qty));
      if (item==='seeds') item='seed';
      if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error:'item' });

      const user = await User.findOne({ kakaoId }); if(!user) return res.status(404).json({ error:'user' });
      const pb = await getPB();
      const unit = item==='salt'?pb.salt:item==='sugar'?pb.sugar:pb.seed;
      const need = unit*qty;
      if (N(user.orcx) < need) return res.status(402).json({ error:'ORCX 부족' });

      const c = await ensureCornDoc(kakaoId);
      user.orcx = N(user.orcx) - need;
      if (item==='seed') c.seed = N(c.seed) + qty;
      else { c.additives = c.additives || {}; c.additives[item] = N(c.additives[item]) + qty; }
      await Promise.all([user.save(), c.save()]);
      res.json({ ok:true, wallet:{ orcx:N(user.orcx) }, additives:c.additives, agri:{ seeds:N(c.seed)+N(c.seeds) }});
    }catch(e){ res.status(500).json({ error:'server error' }); }
  });

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
      const gain = 5 + Math.floor(Math.random()*4);
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

  corn.get('/status', (req,res)=>{
    req.url = '/summary' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    corn.handle(req,res,()=>res.end());
  });

  app.use('/api/corn', corn);
}

/* -------------------- Static (선택: 서버에서 정적도 서빙하고 싶을 때) -------------------- */
// const PUBLIC_DIR = path.join(__dirname, 'public');
// app.use(express.static(PUBLIC_DIR));

/* -------------------- Start -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 OrcaX unified server on http://localhost:${PORT}`);
});





















