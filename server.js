// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// 1) 포트 설정: ngrok → localhost 포트 일치
const PORT = process.env.PORT || 3060;

// 2) MongoDB 연결 문자열: 환경변수 MONGO_URL 혹은 MONGODB_URI 사용
const MONGO_CONN_STRING = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/gamjaFarmDB';
console.log(`🔗 Using MongoDB connection: ${MONGO_CONN_STRING}`);

mongoose.connect(MONGO_CONN_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('🚨 MongoDB 연결 오류:', err));

// 3) 라우터 import
const userdataRouter = require('./routes/userdata');
const userRouter     = require('./routes/user');

// 4) 미들웨어
app.use(cors());
app.use(express.json());

// 5) 엔드포인트 라우팅
app.use('/api/userdata', userdataRouter);
app.use('/api', userRouter);

// 6) 헬스체크
app.get('/', (req, res) => res.send('🥔 감자 농장 서버 실행 중'));

// 7) 서버 시작
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

