// server.js - 메인 백엔드 서버

const express = require('express');
const mongoose = require('mongoose');
const userdataRoute = require("./routes/userdata");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use('/api/user', require('./api/user'));
app.use("/api", userdataRoute);

// 정적 파일 서빙
app.use(express.static('public'));

// MongoDB 연결
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중`);
});
