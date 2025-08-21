'use strict';
require('dotenv').config();

/* ========== deps ========== */
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

/* ========== app & mw ========== */
const app = express();

// GitHub Pages 고정 + 필요시 환경변수 CORS_ORIGINS로 추가
const ALLOW_ORIGINS = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : ['https://byungil-cho.github.io']
);
app.use(cors({
  origin(origin, cb){
    if (!origin) return cb(null, true);                 // 서버-서버/테스트 허용
    if (ALLOW_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========== Mongo ========== */
// 반드시 MONGODB_URL만 사용(다른 키 안 씀). 없으면 로컬 기본값으로만 조용히 동작.
const DEFAULT_DB = 'farmgame';
const RAW_ENV = (process.env.MONGODB_URL || '').trim();
const RAW_URI = RAW_ENV || `mongodb://127.0.0.1:27017/${DEFAULT_DB}`;

function forceDb(uri, name) {
  if (uri.startsWith('mongodb+srv://')) {
    return uri.replace(/^(mongodb\+srv:\/\/[^/]+)\/?([^?]*)/, `$1/${name}`);
  }
  return uri.replace(/^(mongodb:\/\/[^/]+)\/?([^?]*)/, `$1/${name}`);
}
function pickDbName(uri) {
  try {
    const u = new URL(uri);
    const nm = (u.pathname || '').replace(/^\//, '') || DEFAULT_DB;
    return nm === 'farm' ? DEFAULT_DB : nm;
  } catch { return DEFAULT_DB; }
}

let dbName = pickDbName(RAW_URI);
const MONGO_URI = forceDb(RAW_URI, dbName);

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI, { dbName })
  .then(() => {
    const host = mongoose.connection.host;
    const name = mongoose.connection.name;
    console.log(`✅ [MongoDB] connected ${host}/${name}`);
  })
  .catch(err => {
    console.error('❌ [MongoDB] connect error:', err.message);
    process.exit(1);
  });

/* ========== utils ========== */
function get(o, p, d){ try { return p.split('.').reduce((x,k)=>x?.[k], o) ?? d; } catch { return d; } }
function pickSeeds(obj){
  const v = get(obj, 'data.agri.seeds', get(obj, 'data.agri.seed', obj?.seeds ?? obj?.seed));
  const n = Number(v); return Number.isFinite(n) ? n : 0;
}
function idOr(kid){
  const n = Number(kid); const maybe = Number.isFinite(n) ? n : -1;
  return { $or: [
    { kakaoId:kid }, { kakaoId:String(kid) }, { kakaoId:maybe },
    { kakao_id:kid }, { kakao_id:String(kid) }, { kakao_id:maybe },
    { userId:kid  },  { userId:String(kid)  },  { userId:maybe  },
  ]};
}

/* ========== health ========== */
app.get('/', (_req, res) => res.type('text').send('API OK'));
app.get('/api/diag/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.json({ ok, dbName: mongoose.connection.name, mongoHost: mongoose.connection.host });
});

/* ========== corn APIs ========== */
async function seedHandler(req, res){
  try {
    const cd = await mongoose.connection.collection('corn_data')
      .findOne(idOr(req.params.kakaoId), { projection: { data:1, seeds:1, seed:1 } });
    res.json({ ok:true, seeds: pickSeeds(cd || {}) });
  } catch (e) { res.status(500).json({ ok:false, error:e.message }); }
}
async function summaryHandler(req, res){
  try {
    const q  = idOr(req.params.kakaoId);
    const u  = await mongoose.connection.collection('users')
                .findOne(q, { projection: { 'inventory.water':1, 'inventory.fertilizer':1 } });
    const cd = await mongoose.connection.collection('corn_data')
                .findOne(q, { projection: { data:1, seeds:1, seed:1 } });
    res.json({
      ok: true,
      water: Number(u?.inventory?.water ?? 0),
      fertilizer: Number(u?.inventory?.fertilizer ?? 0),
      seeds: pickSeeds(cd || {})
    });
  } catch (e) { res.status(500).json({ ok:false, error:e.message }); }
}

/* 필수 경로 */
app.get('/api/corn/seed/:kakaoId',    seedHandler);
app.get('/api/corn/summary/:kakaoId', summaryHandler);
/* 호환 alias */
app.get(['/api/seed/:kakaoId','/seed/:kakaoId','/corn/seed/:kakaoId'], seedHandler);
app.get(['/api/summary/:kakaoId','/summary/:kakaoId','/corn/summary/:kakaoId'], summaryHandler);

/* 기존 라우터 부착(있으면) */
try {
  const cornRouter = require('./routes/corn');
  app.use('/api/corn', cornRouter);
} catch (e) {
  console.warn('[warn] routes/corn.js 미부착(없으면 정상):', e.message);
}

/* ========== fallbacks ========== */
app.use((req, res) => res.status(404).json({ ok:false, error:'Not Found', path:req.originalUrl }));
app.use((err, req, res, _next) => {
  console.error('[ERR]', err);
  res.status(500).json({ ok:false, error: err.message || 'Server Error' });
});

/* ========== start (3060 고정) ========== */
const PORT = 3060;
app.listen(PORT, () => console.log(`🚀 [Server] listening on :${PORT}`));









