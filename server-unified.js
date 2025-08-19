'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express(); // ✅ app을 가장 먼저 생성
app.use(cors({ origin: ['https://byungil-cho.github.io'], credentials: true }));
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   Mongo 연결 (farm → farmgame 강제)
   ========================= */
const DEFAULT_DB = 'farmgame';
const RAW_URI = (process.env.MONGODB_URL || `mongodb://127.0.0.1:27017/${DEFAULT_DB}`).trim();

function forceDb(uri, name) {
  // mongodb+srv와 일반 URI 모두 지원, 쿼리스트링은 그대로 유지
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

/* =========================
   진단(health) 엔드포인트
   ========================= */
app.get('/api/diag/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.json({
    ok,
    dbName: mongoose.connection.name,
    mongoHost: mongoose.connection.host,
  });
});

/* =========================
   라우터 부착
   ========================= */
try {
  const cornRouter = require('./routes/corn');
  app.use('/api/corn', cornRouter);
} catch (e) {
  console.warn('[warn] routes/corn.js 미존재 또는 오류로 미부착:', e.message);
}

/* =========================
   기본 404 / 에러 핸들러
   ========================= */
app.use((req, res, next) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});
app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(500).json({ ok: false, error: err.message || 'Server Error' });
});

/* =========================
   서버 시작
   ========================= */
const PORT = Number(process.env.PORT || 3060);
app.listen(PORT, () => {
  console.log(`[Server] listening on :${PORT}`);
});
