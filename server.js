// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// 1) 포트 설정 (ngrok 포워딩 포트와 동일하게)
const PORT = process.env.PORT || 3060;

// 2) MongoDB 연결 (환경변수로 URI 설정 권장)
const MONGODB_URI = process.env.MONGODB_URI
  || 'mongodb://localhost:27017/your_database_name';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('🚨 MongoDB 연결 오류:', err));

// 3) 라우터 import
const userRouter     = require('./routes/user');
const userdataRouter = require('./routes/userdata');

// 4) 미들웨어
app.use(cors());
app.use(express.json());

// 5) 라우팅
app.use('/api', userRouter);
app.use('/api/userdata', userdataRouter);

// 6) 헬스체크
app.get('/', (req, res) => {
  res.send('🥔 감자 농장 서버가 실행 중입니다!');
});

// 7) 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
