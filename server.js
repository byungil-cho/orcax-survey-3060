// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

// 사용자 모델 불러오기
const User = require('./models/User');

// 라우터: 사용자 초기화 (회원가입 시 최초 호출)
const initUserRouter = require('./routes/init-user');
app.use('/api/init-user', initUserRouter);

// 라우터: 로그인
const loginRouter = require('./api/login');
app.use('/api/login', loginRouter);

// 라우터: 유저 데이터 조회
const userdataRouter = require('./api/userdata'); // 경로 수정됨
app.use('/api/userdata', userdataRouter);

// 서버 실행
app.listen(port, () => {
  console.log(`🌱 서버 실행 중: http://localhost:${port}`);
});
