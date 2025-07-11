require('dotenv').config(); // .env에서 환경 변수 불러오기

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 라우터 가져오기
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = 3060;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 등록
app.use('/api/seed', seedRoutes);

// MongoDB 연결 및 서버 시작
mongoose.connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('✅ MongoDB 연결 완료');
    app.listen(PORT, () => {
      console.log(`✅ 서버 실행 중 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err.message);
  });
