// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// 1) 포트 설정 (ngrok 포워딩 포트와 일치)
const port = process.env.PORT || 3060;

// 2) MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamjaFarmDB';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('🚨 MongoDB 연결 오류:', err));

// 3) 라우터 import
const userRouter = require('./routes/user');
const userdataRouter = require('./routes/userdata');

// 4) 미들웨어 설정
app.use(cors());
app.use(express.json());

// 5) 라우팅 설정
// 사용자 인증/초기화 등 기존 엔드포인트
app.use('/api', userRouter);
// 유저 데이터 조회 및 업데이트
app.use('/api/userdata', userdataRouter);

// 6) 기본 헬스체크 엔드포인트
app.get('/', (req, res) => {
  res.status(200).send('🥔 감자 농장 서버가 실행 중입니다!');
});

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

