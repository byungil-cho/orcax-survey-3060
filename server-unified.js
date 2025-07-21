// server-unified.js - 관리자 페이지 연동 버전 (2024-07-21)
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// 모델
const User = require('./models/users');

// 출금 요청 모델 (withdraws 컬렉션, 없으면 임시 구조)
const Withdraw = mongoose.model('Withdraw', new mongoose.Schema({
  name: String,
  phone: String,
  wallet: String,
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
app.use('/api/user/v2data', require('./routes/userdata_v2'));
app.use('/api/seed', seedRoutes);
app.use('/api/seed', seedBuyRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/marketdata', marketdataRoutes);
app.use('/api/market', marketRoutes);

// ✅ Mongo 연결
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/farmgame';
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// 세션 설정
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl }),
  })
);

// 📌 API 경로 등록
app.use('/api/factory', factoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user/v2data', userdataV2Routes);
app.use('/api/seed', seedRoutes);
app.use('/api/init-user', initUserRoutes);
app.use('/api/login', loginRoutes);

// ✅ 서버 헬스체크(PING)
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// ✅ 관리자/마이페이지용: 전체 유저 자산 리스트 (닉네임, 카카오ID, 자원 등)
app.get('/api/userdata/all', async (req, res) => {
  try {
    const users = await User.find();
    const list = users.map(u => ({
      nickname: u.nickname,
      kakaoId: u.kakaoId,
      isConnected: true, // 필요시 세션체크
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

// ✅ 관리자용: 서버 전원상태(몽고 연결)
app.get('/api/power-status', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.json({ status: mongoReady ? "정상" : "오류", mongo: mongoReady });
});

// ✅ 관리자/출금 요청 리스트
app.get('/api/withdraw', async (req, res) => {
  try {
    const data = await Withdraw.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

// ✅ 유저 통합 프로필 API (마이페이지/내 정보 전체)
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

// ✅ 감자/보리 프론트 구조에 맞춘 /api/userdata 라우터
app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId is required' });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
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

// ✅ [완전보강] 씨앗(씨보리/씨감자) 체크, 차감, 반환 일치 처리
app.post('/api/factory/harvest', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const cropKey = cropType === 'potato' ? 'gamja' : 'bori';
    const seedKey = cropType === 'potato' ? 'seedPotato' : 'seedBarley';
    const growthKey = cropType === 'potato' ? 'potato' : 'barley';
    let seedCount = (user[seedKey] ?? 0);
    if (user.inventory && typeof user.inventory[seedKey] === 'number') {
      seedCount = Math.max(seedCount, user.inventory[seedKey]);
    }
    if (seedCount < 1) {
      return res.status(400).json({ success: false, message: '씨앗이 없습니다' });
    }
    if (typeof user[seedKey] === 'number' && user[seedKey] > 0) user[seedKey] -= 1;
    if (user.inventory && typeof user.inventory[seedKey] === 'number' && user.inventory[seedKey] > 0) user.inventory[seedKey] -= 1;
    const currentGrowth = user.growth?.[growthKey] || 0;
    if (currentGrowth < 5) {
      return res.status(400).json({ success: false, message: 'Not enough growth to harvest' });
    }
    const rewardOptions = [3, 5, 7];
    const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)];
    if (!user.storage) user.storage = {};
    user.storage[cropKey] = (user.storage[cropKey] || 0) + reward;
    user.growth[growthKey] = 0;
    await user.save();
    let newSeedCount = (user[seedKey] ?? 0);
    if (user.inventory && typeof user.inventory[seedKey] === 'number') {
      newSeedCount = Math.max(newSeedCount, user.inventory[seedKey]);
    }
    res.json({
      success: true,
      message: '수확 성공',
      reward,
      cropType,
      cropAmount: user.storage[cropKey],
      storage: user.storage,
      growth: user.growth,
      userSeed: newSeedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ "물/거름/성장포인트 증가" 라우터
app.patch('/api/factory/use-resource', async (req, res) => {
  const { kakaoId, cropType, water = 0, fertilizer = 0 } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if ((user.water ?? 0) < water) return res.json({ success: false, message: '물 부족!' });
    if ((user.fertilizer ?? 0) < fertilizer) return res.json({ success: false, message: '거름 부족!' });
    user.water -= water;
    user.fertilizer -= fertilizer;
    user.growth = user.growth || {};
    const growthKey = cropType === 'potato' ? 'potato' : 'barley';
    const growthInc = (water * 1) + (fertilizer * 2);
    user.growth[growthKey] = (user.growth[growthKey] || 0) + growthInc;
    await user.save();
    res.json({
      success: true,
      growth: user.growth[growthKey],
      water: user.water,
      fertilizer: user.fertilizer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
