'use strict';
require('dotenv').config();

/* ===== 의존성 ===== */
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

/* ===== 앱 생성 (※ app 먼저 만들고 use 호출) ===== */
const app = express();
app.use(cors({ origin: true, credentials: true })); // 프런트(GitHub Pages 등)에서 호출 허용
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

/* ===== 라우터 부착 ===== */
try {
  const cornRouter = require('./routes/corn');        // 기존 파일 그대로 사용
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
