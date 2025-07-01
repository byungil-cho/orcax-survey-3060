const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

require('dotenv').config(); // .env 사용

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orcax-club'; // 기본값도 설정

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// 라우터 연결 예시
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

app.get('/', (req, res) => {
  res.send('OrcaX 서버 정상 작동 중입니다.');
});

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});

