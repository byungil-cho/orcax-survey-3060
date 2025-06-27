// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// 라우터 import
const userRouter = require('./routes/user');
const userdataRouter = require('./routes/userdata');

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우팅 설정
// 기존 사용자 관련 라우터
app.use('/api', userRouter);
// 유저 데이터 조회/업데이트 라우터
app.use('/api/userdata', userdataRouter);

// 기본 헬스체크
app.get('/', (req, res) => {
  res.send('🥔 감자 농장 서버가 실행 중입니다!');
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
