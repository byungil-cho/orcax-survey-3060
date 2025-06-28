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
// routes 폴더 내 파일
app.use('/api/login',     require('./routes/login.js'));      // 파일 경로: <project-root>/routes/login.js
app.use('/api/register',  require('./routes/register.js'));   // 파일 경로: <project-root>/routes/register.js
app.use('/api/userdata',  require('./routes/userdata.js'));   // 파일 경로: <project-root>/routes/userdata.js
app.use('/api/use-token', require('./routes/use-token.js'));  // 파일 경로: <project-root>/routes/use-token.js

// api 폴더 내 파일
app.use('/api/purchase',  require('./api/purchase.js'));      // 파일 경로: <project-root>/api/purchase.js
app.use('/api/farm',      require('./api/farm.js'));          // 파일 경로: <project-root>/api/farm.js
app.use('/api/exchange',  require('./api/exchange.js'));      // 파일 경로: <project-root>/api/exchange.js
// 필요 시 다른 api/*.js 파일도 동일하게 등록
app.use('/api/purchase',  require('./api/purchase'));
app.use('/api/farm',      require('./api/farm'));
app.use('/api/exchange',  require('./api/exchange'));
// 필요 시 다른 api/*.js도 동일하게 등록

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
