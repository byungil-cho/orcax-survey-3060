'use strict';
require('dotenv').config();

/* ===== 의존성 ===== */
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

/* ===== CORS 허용 오리진 ===== */
const ALLOW = 'https://byungil-cho.github.io';

/* ===== 앱 생성 ===== */
const app = express();

/* ---- CORS: 단일 설정만 사용(프리플라이트 포함) ----
   ※ app.options('*', ...) 는 Express 5에서 path-to-regexp 에러를 유발하므로 제거 */
app.use(cors({ origin: ALLOW, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== Mongo 연결 (farm → farmgame 강제 교정) ===== */
const DEFAULT_DB = 'farmgame';
const RAW_URI = (process.env.MONGODB_URL || `mongodb://127.0.0.1:27017/${DEFAULT_DB}`).trim();

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
    return nm === 'farm' ? DEFAULT_DB : nm; // farm → farmgame
  } catch {
    return DEFAULT_DB;
  }
}
let dbName = pickDbName(RAW_URI);
const MONGO_URI = forceDb(RAW_URI, dbName);

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI, { dbName, serverSelectionTimeoutMS: 8000 });
mongoose.connection.on('connected', () => {
  console.log(`[MongoDB] connected ${mongoose.connection.host}/${mongoose.connection.name}`);
});
mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] error:', err.message);
});

/* ===== 루트/헬스 (백지 방지 + 상태 확인) ===== */
app.get('/', (_req, res) => res.type('text').send('API OK'));
app.get('/api/diag/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.json({ ok, dbName: mongoose.connection.name, mongoHost: mongoose.connection.host });
});
// ===== [ADD] 공통 유틸 + ID 변형 대응 =====
function get(o, p, d) { try { return p.split('.').reduce((x,k)=>x?.[k], o) ?? d; } catch { return d; } }
function pickSeeds(obj) {
  const v = get(obj, 'data.agri.seeds', get(obj, 'data.agri.seed', obj?.seeds ?? obj?.seed));
  const n = Number(v); return Number.isFinite(n) ? n : 0;
}
function idOr(kid) {
  const n = Number(kid); const maybe = Number.isFinite(n) ? n : -1;
  return { $or: [
    { kakaoId: kid }, { kakaoId: String(kid) }, { kakaoId: maybe },
    { kakao_id: kid }, { kakao_id: String(kid) }, { kakao_id: maybe },
    { userId:  kid }, { userId:  String(kid) }, { userId:  maybe },
  ]};
}

// ===== [ADD] 프리플라이트(OPTIONS) 처리 – Express5 호환(정규식 사용) =====
app.options(/.*/, cors({ origin: true, credentials: true }));

// ===== [ADD] 옥수수 씨앗/요약 핸들러(서버가 경로 alias 모두 수용) =====
async function seedHandler(req, res) {
  try {
    const cd = await mongoose.connection.collection('corn_data')
      .findOne(idOr(req.params.kakaoId), { projection: { data:1, seeds:1, seed:1 } });
    return res.json({ ok: true, seeds: pickSeeds(cd || {}) });
  } catch (e) { return res.status(500).json({ ok:false, error: e.message }); }
}
async function summaryHandler(req, res) {
  try {
    const q = idOr(req.params.kakaoId);
    const u  = await mongoose.connection.collection('users')
                .findOne(q, { projection: { 'inventory.water':1, 'inventory.fertilizer':1 }});
    const cd = await mongoose.connection.collection('corn_data')
                .findOne(q, { projection: { data:1, seeds:1, seed:1 }});
    return res.json({
      ok: true,
      water: Number(u?.inventory?.water ?? 0),
      fertilizer: Number(u?.inventory?.fertilizer ?? 0),
      seeds: pickSeeds(cd || {})
    });
  } catch (e) { return res.status(500).json({ ok:false, error: e.message }); }
}

// ===== [ADD] 경로 alias 다 받기 (감자농장과 동일 패턴도 커버) =====
app.get(['/api/corn/seed/:kakaoId','/api/seed/:kakaoId','/corn/seed/:kakaoId','/seed/:kakaoId'], seedHandler);
app.get(['/api/corn/summary/:kakaoId','/api/summary/:kakaoId','/corn/summary/:kakaoId','/summary/:kakaoId'], summaryHandler);


/* ===== 라우터 부착 ===== */
try {
  const cornRouter = require('./routes/corn'); // 기존 파일 그대로 사용
  app.use('/api/corn', cornRouter);
} catch (e) {
  console.warn('[warn] routes/corn.js 미부착:', e.message);
}

/* ===== 공통 핸들러 ===== */
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(500).json({ ok: false, error: err.message || 'Server Error' });
});

/* ===== 서버 시작 ===== */
const PORT = Number(process.env.PORT || 3060);
app.listen(PORT, () => console.log(`[Server] listening on :${PORT}`));
