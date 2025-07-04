// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

// 사용자 스키마
const userSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  orcx: Number,
  water: Number,
  fertilizer: Number,
  potato: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 0 },
  barleySeed: { type: Number, default: 0 },
  barn: { type: String, default: '비어 있음' },
  lastHarvestDate: { type: Date, default: new Date('2025-06-30T15:00:00.000Z') },
  inventory: { type: Array, default: [] }
});
const User = mongoose.model('User', userSchema);

// 라우터: 사용자 초기화 (회원가입 시 최초 호출)
const initUserRouter = require('./routes/init-user');
app.use('/api/init-user', initUserRouter);

// 라우터: 로그인
const loginRouter = require('./routes/login');
app.use('/api/login', loginRouter);

// 라우터: 유저 데이터 조회
const userdataRouter = require('./routes/userdata');
app.use('/api/userdata', userdataRouter);

// 서버 실행
app.listen(port, () => {
  console.log(`🌱 서버 실행 중: http://localhost:${port}`);
});
