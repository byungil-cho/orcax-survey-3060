const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/gamjafarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 연결 실패:'));
db.once('open', () => {
  console.log('✅ MongoDB 연결 성공');
});

// API 라우터 연결 (경로 통일: ./api)
const userRoutes = require('./api/user');
const tokenRoutes = require('./api/token');
const purchaseRoutes = require('./api/purchase');
const userdataRoutes = require('./api/userdata');
const farmRoutes = require('./api/farm');
const marketRoutes = require('./api/market');
const seedBankRoutes = require('./api/seedBank');
const processingRoutes = require('./api/processing');
const withdrawRoutes = require('./api/withdraw');
const authRoutes = require('./api/auth');
const exchangeRoutes = require('./api/exchange');

// 라우팅
app.use('/api/user', userRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/userdata', userdataRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/seedbank', seedBankRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exchange', exchangeRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
