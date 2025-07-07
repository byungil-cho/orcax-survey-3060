// server-unified.js (통합 서버 파일)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3060;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 오류:', err));

const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const shopRouter = require('./routes/shop');
const marketRouter = require('./routes/market');
const seedStatusRouter = require('./routes/seed-status');
const usersRouter = require('./routes/users');

app.use('/api/init-user', initUserRouter);
app.use('/api/userdata', userDataRouter);
app.use('/api/shop', shopRouter);
app.use('/api/market', marketRouter);
app.use('/api/seed/status', seedStatusRouter);
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.send('🚜 감자 농장 API 서버 정상 작동 중');
});

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});