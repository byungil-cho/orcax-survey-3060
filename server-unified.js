// server-unified.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./user');
const marketRoutes = require('./market');
const seedRoutes = require('./seed');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// 통합된 API 라우트들
app.use('/api/users', userRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/seed', seedRoutes);

mongoose.connect('mongodb://localhost:27017/OrcaX', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('📡 MongoDB 연결 성공');
    app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ DB 연결 실패:', err);
  });
