require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/user');
const userDataRoutes = require('./routes/userdata_v2');
const farmRoutes = require('./routes/farm');
const seedRoutes = require('./routes/seed');
const seedStatusRoutes = require('./routes/seed-status');
const seedPriceRoutes = require('./routes/seed-price');
const seedBuyRoutes = require('./routes/seed-buy');  // 씨앗 구매 라우트

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// 라우트 연결
app.use('/api/user', userRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/seed', seedStatusRoutes);
app.use('/api/seed', seedPriceRoutes);
app.use('/api/seed', seedBuyRoutes);  // 누락 시 404 오류 발생함

// 서버 실행
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});
