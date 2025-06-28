require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const session    = require('express-session');
const path       = require('path');

const app  = express();
const port = process.env.PORT || 3060;

// CORS 설정: GitHub Pages에서 호출 가능
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || '비밀키',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ─────────── 라우터 등록 ───────────
app.use('/api/login',    require('./routes/login'));      // POST /api/login
app.use('/api/register', require('./routes/register'));   // POST /api/register
app.use('/api/userdata', require('./routes/userdata'));   // GET  /api/userdata
app.use('/api/use-token',require('./routes/use-token'));  // POST /api/use-token
app.use('/api/purchase', require('./api/purchase'));       // POST /api/purchase (api 폴더)
app.use('/api/farm',     require('./api/farm'));           // GET/POST farm 로직
app.use('/api/exchange', require('./api/exchange'));       // POST exchange
// 필요한 다른 api/*.js 파일도 이와 같이 등록

// ─────────── MongoDB 연결 ───────────
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공!'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ─────────── 정적 파일 서빙 ───────────
app.use(express.static(path.join(__dirname, 'public')));

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '서버 작동 중' });
});

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
