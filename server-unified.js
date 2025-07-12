require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3060;
const MONGODB_URL = process.env.MONGODB_URL;

// 기본 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 연결
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userdata');
const farmRoutes = require('./routes/farm');
const seedRoutes = require('./routes/seed');         // ✅ 기존 seed 라우터 (기본 경로들)
const initUserRoutes = require('./routes/init-user');

// ✅ 추가된 seed 관련 세부 라우터
const seedStatus = require('./routes/seed-status');
const seedPrice = require('./routes/seed-price');
const seedBuy = require('./routes/seed-buy');

// API 경로 등록
app.use('/api/login', loginRoute);
app.use('/api/userdata', userRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/init-user', initUserRoutes);

// ✅ 세부 seed 라우터 연결
app.use('/api/seed/status', seedStatus);
app.use('/api/seed/price', seedPrice);
app.use('/api/seed/buy', seedBuy);

// 테스트용 루트
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Unified Backend is running");
});

// DB 연결 및 서버 실행
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err);
});
