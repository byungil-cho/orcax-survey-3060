'use strict';
require('dotenv').config();

/* =========================
   의존성
   ========================= */
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

/* =========================
   앱 & 미들웨어
   ========================= */
const app = express();

/* CORS: GitHub Pages(고정) + 필요시 환경변수(CORS_ORIGINS)로 추가 허용
   - credentials:true를 쓰므로 와일드카드(*) 금지
   - 쉼표 구분 예: CORS_ORIGINS="https://byungil-cho.github.io,https://cook.example.com"
*/
const ALLOW_ORIGINS = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : ['https://byungil-cho.github.io']
);
app.use(cors({
  origin(origin, cb){
    if (!origin) return cb(null, true);                  // 서버-서버/로컬 curl 허용
    if (ALLOW_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   MongoDB 연결 (MONGODB_URL만 사용)
   - /farm 이 들어와도 자동으로 /farmgame 로 강제
   ========================= */
const DEFAULT_DB = 'farmgame';

if (!process.env.MONGODB_URL) {
  console.error('❌ 환경변수 MONGODB_URL 이 설정되어 있지 않습니다.');
  process.exit(1);
}
const RAW_URI = process.env.MONGODB_URL.trim();

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
  } catch {
    return DEFAULT_DB;
  }
}

let dbName  = pickDbName(RAW_URI);
const MONGO = forceDb(RAW_URI, dbName);

mongoose.set('strictQuery', true);
mongoose.connect(MONGO, { dbName })
  .then(() => console.log(`✅ [MongoDB] connected ${mongoose.connection.host}/${mongoose.connection.name}`))
  .catch(err => {
    console.error('❌ [MongoDB] connect error:', err.message);
    process.exit(1);
  });

/* =========================
   유틸 (스키마/키 변형 흡수)
   ========================= */
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

/* =========================
   루트/헬스 (백지 방지 + 상태 확인)
   ========================= */
app.get('/', (_req, res) => res.type('text').send('API OK'));
app.get('/api/diag/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.json({ ok, dbName: mongoose.connection.name, mongoHost: mongoose.connection.host });
});

/* =========================
   옥수수 API (필수 2개 + 과거 alias 수용)
   ========================= */
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
/* 과거/다른 클라이언트 호환 alias (원치 않으면 아래 4줄 삭제해도 무방) */
app.get(['/api/seed/:kakaoId','/seed/:kakaoId','/corn/seed/:kakaoId'], seedHandler);
app.get(['/api/summary/:kakaoId','/summary/:kakaoId','/corn/summary/:kakaoId'], summaryHandler);

/* 기존 corn 라우터가 따로 있다면 유지 부착(없으면 경고만) */
try {
  const cornRouter = require('./routes/corn');
  app.use('/api/corn', cornRouter);
} catch (e) {
  console.warn('[warn] routes/corn.js 미부착(없으면 정상):', e.message);
}

/* =========================
   공통 핸들러
   ========================= */
app.use((req, res) => res.status(404).json({ ok:false, error:'Not Found', path:req.originalUrl }));
app.use((err, req, res, _next) => {
  console.error('[ERR]', err);
  res.status(500).json({ ok:false, error: err.message || 'Server Error' });
});

/* =========================
   서버 시작 (무조건 3060 고정)
   ========================= */
const PORT = 3060;
app.listen(PORT, () => console.log(`🚀 [Server] listening on :${PORT}`));
