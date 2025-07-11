// server-unified.js

require('dotenv').config(); // ✅ .env 지원

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userdata');
const seedRoutes = require('./routes/Seed');
const priceRoutes = require('./routes/price');

const app = express();
const PORT = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());
app.get("/api/status", (req, res) => {
  res.send("서버 정상 작동 중입니다.");
});

// ✅ 라우터 통합
app.use('/api/userdata', userRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/seed/price', priceRoutes);

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 연결 완료');
  app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중 http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB 연결 실패:', err.message);
  process.exit(1); // 명시적으로 종료
});
