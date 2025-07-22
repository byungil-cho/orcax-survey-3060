// server-unified.js - OrcaX 마이페이지, 관리자, 자산/출금/대시보드 통합
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// [!!] User 모델 명확 선언(중복X, 파일명 정확!)
const User = require('./models/users');

// Withdraw 모델(중복X)
const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  wallet: String,
  amount: Number,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

// 라우터들
const factoryRoutes = require('./routes/factory');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userdataV2Routes = require('./routes/userdata_v2');
const seedRoutes = require('./routes/seed-status');
const seedBuyRoutes = require('./routes/seed');
const initUserRoutes = require('./routes/init-user');
const loginRoutes = require('./routes/login');
const processingRoutes = require('./routes/processing');
const marketdataRoutes = require('./routes/marketdata');
const marketRoutes = require('./routes/marketdata');

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우터
app.use('/api/factory', factoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user/v2data', userdataV2Routes); // 모든 페이지(감자, 보리 등) 영향 없음
app.use('/api/seed', seedRoutes);
app.use('/api/seed', seedBuyRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/marketdata', marketdataRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/init-user', initUserRoutes);
// *** 로그인 엔드포인트 아래에 명확하게 추가! ***
app.use('/api/login', loginRoutes);

// Mongo 연결
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// 세션
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl }),
  })
);

// [출금 신청]
app.post('/api/withdraw', async (req, res) => {
  const { nickname, email, phone, wallet, amount } = req.body;
  try {
    if (!nickname || !email || !phone || !wallet || !amount || isNaN(amount)) {
      return res.json({ success: false, message: "모든 정보를 입력해 주세요." });
    }
    await Withdraw.create({
      name: nickname,
      email,
      phone,
      wallet,
      amount,
      createdAt: new Date()
    });
    res.json({ success: true, message: "출금 신청 완료" });
  } catch (e) {
    res.json({ success: false, message: "출금 신청 실패" });
  }
});

// [유저 토큰 직접 수정/지급]
app.post('/api/user/update-token', async (req, res) => {
  const { kakaoId, orcx } = req.body;
  if (!kakaoId) return res.json({ success: false, message: '카카오ID 필요' });
  try {
    const user = await User.findOneAndUpdate({ kakaoId }, { orcx }, { new: true });
    if (!user) return res.json({ success: false, message: '유저 없음' });
    res.json({ success: true, user });
  } catch (e) {
    res.json({ success: false, message: 'DB 오류' });
  }
});

// [출금신청 내역에서 '출금하기' 처리]
app.post('/api/withdraw/process', async (req, res) => {
  const { withdrawId, amount } = req.body;
  try {
    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw) return res.json({ success: false, message: "출금 신청 내역 없음" });
    if (withdraw.completed) return res.json({ success: false, message: "이미 완료됨" });
    const user = await User.findOne({ nickname: withdraw.name });
    if (!user) return res.json({ success: false, message: "유저 없음" });
    if ((user.orcx ?? 0) < amount) return res.json({ success: false, message: "토큰 부족" });
    user.orcx -= amount;
    await user.save();
    withdraw.completed = true;
    await withdraw.save();
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: "서버 오류" });
  }
});

// [유저 전체 자산 API]
app.get('/api/userdata/all', async (req, res) => {
  try {
    const users = await User.find();
    const list = users.map(u => ({
      nickname: u.nickname,
      kakaoId: u.kakaoId,
      isConnected: true,
      orcx: u.orcx ?? 0,
      water: u.water ?? 0,
      fertilizer: u.fertilizer ?? 0,
      potatoCount: u.storage?.gamja ?? 0,
      barleyCount: u.storage?.bori ?? 0,
      seedPotato: u.seedPotato ?? 0,
      seedBarley: u.seedBarley ?? 0,
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'DB 오류' });
  }
});

// [서버 전원상태/헬스체크]
app.get('/api/power-status', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.json({ status: mongoReady ? "정상" : "오류", mongo: mongoReady });
});
app.get('/api/ping', (req, res) => res.status(200).send('pong'));

// [출금신청 리스트/관리자]
app.get('/api/withdraw', async (req, res) => {
  try {
    const data = await Withdraw.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

// [유저 통합 프로필(마이페이지)]
app.get('/api/user/profile/:nickname', async (req, res) => {
  const { nickname } = req.params;
  if (!nickname) return res.status(400).json({ error: "닉네임 필요" });
  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "유저 없음" });
    res.json({
      nickname: user.nickname,
      kakaoId: user.kakaoId,
      farmName: user.farmName,
      level: user.level || 1,
      grade: user.grade || "초급",
      orcx: user.orcx || 0,
      water: user.water || 0,
      fertilizer: user.fertilizer || 0,
      seedPotato: user.seedPotato || 0,
      seedBarley: user.seedBarley || 0,
      potato: user.storage?.gamja || 0,
      barley: user.storage?.bori || 0,
      products: user.products || {},
      lastLogin: user.lastLogin,
    });
  } catch (e) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// [감자/보리 프론트 연동 라우터]
app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        inventory: {
          water: user.water ?? 0,
          fertilizer: user.fertilizer ?? 0,
          seedPotato: user.seedPotato ?? 0,
          seedBarley: user.seedBarley ?? 0
        },
        orcx: user.orcx ?? 0,
        wallet: { orcx: user.orcx ?? 0 },
        potato: user.storage?.gamja ?? 0,
        barley: user.storage?.bori ?? 0,
        growth: user.growth ?? {}
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// [씨앗상점 대응 - v2data 직접 구현! (중복X, 기존 라우터와 병행)]
app.post('/api/user/v2data', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      user: {
        orcx: user.orcx ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// [회원가입/로그인 - 반드시 kakaoId 저장 보장!]
app.post('/api/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.json({ success: false, message: "kakaoId/nickname 필수" });

  let user = await User.findOne({ kakaoId });
  if (!user) {
    user = await User.create({
      kakaoId,
      nickname,
      orcx: 10,
      water: 10,
      fertilizer: 10,
      seedPotato: 0,
      seedBarley: 0,
      storage: { gamja: 0, bori: 0 },
      growth: { potato: 0, barley: 0 },
      products: {},
    });
  } else {
    // 이미 있는 유저도 kakaoId/nickname 보정
    if (!user.kakaoId) user.kakaoId = kakaoId;
    if (!user.nickname) user.nickname = nickname;
    await user.save();
  }
  res.json({ success: true, user });
});

// 서버 실행
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
