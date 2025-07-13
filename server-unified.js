const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3060;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ 라우터 불러오기
const seedStatusRoute = require('./routes/seed');       // /api/seed/status, /api/seed/price
const seedBuyRoute = require('./routes/seed-buy');      // /api/seed/buy

// ✅ 라우터 등록
app.use('/api', seedStatusRoute);       // 예: /api/seed/status
app.use('/api/seed', seedBuyRoute);     // 예: /api/seed/buy

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// ✅ 기본 응답
app.get('/', (req, res) => {
  res.send('🌱 OrcaX 감자/보리 농장 API 서버 작동 중!');
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
