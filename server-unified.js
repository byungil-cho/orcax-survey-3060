// server-unified.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3060;

// 기본 미들웨어
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch((err) => console.error('❌ MongoDB 연결 오류:', err));

// 라우터 모듈 불러오기
const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const shopRouter = require('./routes/shop');
const seedRouter = require('./routes/seed');
const marketRouter = require('./routes/market');

// API 라우터 연결
app.use('/api/init-user', initUserRouter);   // POST: 사용자 초기화
app.use('/api/userdata', userDataRouter);    // GET: 사용자 정보
app.use('/api/shop', shopRouter);            // GET: 샵 아이템 목록

// ✅ 추가된 라우터들
app.use('/seed', seedRouter);                // GET: /seed/status, POST: /seed/purchase 등
app.use('/market', marketRouter);            // GET: /market/items
app.use('/users', userDataRouter);           // GET: /users/me? → 동일 라우터 재사용

// 기본 루트
app.get('/', (req, res) => {
  res.send('🚜 감자 농장 API 서버 정상 작동 중');
});

// 서버 실행
app.listen(port, () => {
  console.log(`🌱 서버가 ${port} 포트에서 실행 중입니다.`);
});
