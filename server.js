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

// 라우터 1: 사용자 초기화 (회원가입 시 최초 호출)
app.post('/api/init-user', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  try {
    const existingUser = await User.findOne({ kakaoId });
    if (existingUser) {
      return res.status(200).json({ message: '이미 존재하는 사용자입니다.' });
    }
    const newUser = new User({ kakaoId, nickname, orcx: 10, water: 10, fertilizer: 10 });
    await newUser.save();
    console.log('✅ 신규 유저 생성 및 초기 자원 지급 완료');
    res.status(200).json({ message: '유저 초기화 완료' });
  } catch (err) {
    console.error('🚨 유저 초기화 실패:', err);
    res.status(500).json({ message: '서버 에러' });
  }
});

// 라우터 2: 로그인
app.post('/api/login', async (req, res) => {
  const { kakaoId } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('🚨 로그인 실패:', err);
    res.status(500).json({ message: '서버 에러' });
  }
});

// 라우터 3: 유저 데이터 조회
app.get('/api/userdata', async (req, res) => {
  const { kakaoId } = req.query;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('🚨 유저 데이터 로드 실패:', err);
    res.status(500).json({ message: '서버 에러' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`🌱 서버 실행 중: http://localhost:${port}`);
});
