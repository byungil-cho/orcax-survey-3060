require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3060;

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

// 라우터
const initUserRouter = require('./routes/init-user');
const shopRouter = require('./routes/shop');
const loginRouter = require('./routes/login');
const userdataRouter = require('./routes/userdata');

app.use('/api/init-user', initUserRouter);
app.use('/api/shop', shopRouter);
app.use('/api/login', loginRouter);
app.use('/api/userdata', userdataRouter);

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
