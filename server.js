const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3060;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('📊 orcax-survey-3060 설문 서버 실행 중입니다!');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공 (설문)');
    app.listen(PORT, () => {
      console.log(`📊 orcax-survey-3060 포트 ${PORT}에서 실행 중`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
  });
