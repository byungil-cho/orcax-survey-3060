const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // 환경변수 읽기

const app = express();
const port = process.env.PORT || 3060;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// 서버 테스트용 라우트
app.get('/', (req, res) => {
  res.send('✅ 서버 실행 중!');
});

// MongoDB 연결
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공!');
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err);
});

// 서버 실행
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
