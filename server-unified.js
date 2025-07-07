// server-unified.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3060;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());

// 몽고디비 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 연결 오류:'));
db.once('open', () => {
  console.log('MongoDB 연결 성공');
});

// 라우터들
const initUserRouter = require('./routes/init-user');
const loginRouter = require('./routes/login');
const userdataRouter = require('./routes/userdata');
const shopRouter = require('./routes/shop');

app.use('/api/init-user', initUserRouter);
app.use('/api/login', loginRouter);
app.use('/api/userdata', userdataRouter);
app.use('/api/shop', shopRouter);

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
