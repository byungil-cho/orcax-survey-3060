require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
const port = process.env.PORT || 3060;

// CORS 설정 (GitHub Pages에서 요청 허용)
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true,
}));

// 요청 본문 JSON 파싱
app.use(express.json());

// 세션 설정 (MongoDB에 저장)
app.use(session({
  secret: process.env.SESSION_SECRET || '비밀키',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    ttl: 14 * 24 * 60 * 60, // 14일
  }),
  cookie: { secure: false },
}));

// ─────────── 라우터 등록 ───────────
app.use('/api/login',     require('./routes/login.js'));
app.use('/api/register',  require('./routes/register.js'));
app.use('/api/userdata',  require('./routes/userdata.js'));  // 사용자 데이터
app.use('/api/use-token', require('./routes/use-token.js'));
app.use('/api/purchase',  require('./api/purchase.js'));
app.use('/api/auth',      require('./api/auth.js'));
app.use('/api/exchange',  require('./api/exchange.js'));

// ─────────── 헬스체크 ───────────
// 루트 접속 확인용
app.get('/', (req, res) => {
  res.send('API Server OK');
});
// API 작동 확인용
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '서버 작동 중' });
});

// ─────────── MongoDB 연결 ───────────
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB 연결 성공!'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ─────────── 정적 파일 서빙 (필요 시) ───────────
app.use(express.static(path.join(__dirname, 'public')));

// ─────────── 서버 시작 ───────────
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
