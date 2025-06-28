require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const session    = require('express-session');
const path       = require('path');

const app  = express();
const port = process.env.PORT || 3060;

// CORS 설정: GitHub Pages(OrcaX)에서 API 호출 허용
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || '비밀키',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // HTTPS 적용 시 true 로 변경
}));

// ─────────── 라우터 등록 ───────────
// auth: 로그인/회원가입 (routes/login.js 혹은 api/auth.js)
// userdata: 사용자 자산 조회 (routes/userdata.js)
// purchase: 구매 처리 (routes/purchase.js)
// register, farm, exchange 등 api/ 내 다른 파일들은
// api/ 폴더에서 직접 require 해서 app.use 해 주시면 됩니다.

app.use('/api/login',     require('./routes/login'));       // POST /api/login
app.use('/api/register',  require('./routes/register'));    // POST /api/register (필요 시)
app.use('/api/userdata',  require('./routes/userdata'));    // GET  /api/userdata
app.use('/api/use-token', require('./routes/use-token'));   // POST /api/use-token (필요 시)
app.use('/api/purchase',  require('./routes/purchase'));    // POST /api/purchase
app.use('/api/farm',      require('./api/farm'));           // api/ 폴더 하위 farm 로직
app.use('/api/exchange',  require('./api/exchange'));       // api/ 교환 로직
// …필요한 만큼 다른 api/*.js 파일을 마운트…

// ─────────── MongoDB 연결 ───────────
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공!'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ─────────── 정적 파일 서빙 ───────────
// GitHub Pages로 배포할 정적 파일들은 /public/OrcaX 에 위치한다고 가정
app.use(express.static(path.join(__dirname, 'public')));

// 헬스체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '서버 작동 중' });
});

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});

