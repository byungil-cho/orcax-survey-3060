require('dotenv').config();
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const path         = require('path');

const app = express();
const port = process.env.PORT || 3060;

// ─── CORS 설정 ───────────────────────────
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true,
}));

// ─── JSON 파싱 ────────────────────────────
app.use(express.json());

// ─── 세션 설정 ───────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || '비밀키',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    ttl: 14 * 24 * 60 * 60,  // 14일
  }),
  cookie: { secure: false },
}));

// ─── 라우터 연결 ─────────────────────────
// 🔧 여기를 수정했다. routes → api로 바꿈
app.use('/api/login',    require('./api/login'));
app.use('/api/userdata', require('./routes/userdata'));
// 필요 시 다른 API도 여기에 마운트

// ─── 헬스체크 ────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ success: true, message: '서버 작동 중' });
});

// ─── 정적 파일 서빙 ───────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB 연결 ─────────────────────────
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공!'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ─── 서버 시작 ───────────────────────────
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
