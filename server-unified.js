// server-unified.js (통합 서버 파일)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3060;

const loginRouter = require('./routes/login');
app.use('/api/login', loginRouter);

// 미들웨어
app.use(cors());
app.use(express.json());

// DB 연결
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 오류:', err));

// 라우터 연결
const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const shopRouter = require('./routes/shop');

app.use('/api/init-user', initUserRouter);
app.use('/api/userdata', userDataRouter);
app.use('/api/shop', shopRouter);

// 기본 경로 에러 방지
app.get('/', (req, res) => {
  res.send('🚜 감자 농장 API 서버 정상 작동 중');
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
