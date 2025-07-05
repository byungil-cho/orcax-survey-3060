// 📁 파일: app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const seedRoutes = require('./routes/seed');
const userRoutes = require('./routes/user');
const marketRoutes = require('./routes/market');

const app = express();

app.use(bodyParser.json());

// 📌 API 라우터 등록
app.use('/api/seed', seedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/market', marketRoutes);

// 기본 포트 설정
const PORT = process.env.PORT || 3060;

mongoose.connect('mongodb://localhost:27017/gamjashop', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB 연결 성공');
    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
  });
