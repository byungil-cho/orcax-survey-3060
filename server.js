// ✅ OrcaX 감자 농장 - server.js 최종 통합본
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3060;

// ✅ 미들웨어
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB 연결 (환경변수 이름 정확히 적용)
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch((err) => console.error('❌ MongoDB 연결 실패:', err));

// ✅ 테스트 라우트
app.get('/', (req, res) => {
  res.send('✅ 서버 정상 작동 중!');
});

// ✅ 사용자 관련 라우터 불러오기
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 포트 ${PORT}에서 실행 중!`);
});
