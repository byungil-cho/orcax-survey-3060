// server-unified.js - OrcaX 통합 서버 전체본 (2024-07-18 최종, 감자/보리 데이터 공통 구조 적용)

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

// 라우터들
const factoryRoutes = require('./routes/factory');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userdataV2Routes = require('./routes/userdata_v2');
const seedRoutes = require('./routes/seed-status');
const seedBuyRoutes = require('./routes/seed');
const initUserRoutes = require('./routes/init-user');
const loginRoutes = require('./routes/login');

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // ★ 이거 없으면 req.body 못 읽음
app.use(express.urlencoded({ extended: true }));
app.use('/api/user/v2data', require('./routes/userdata_v2'));
app.use('/api/seed', seedRoutes);    // (seed-status.js)
app.use('/api/seed', seedBuyRoutes); // (seed.js 구매 라우트 등록!)

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

// ✅ 서버 헬스체크(PING) 라우트 추가
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
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
        barley: user.storage?.bori ?? 0
      }
    });
  } catch (err) {
    console.error("❌ /api/userdata 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 수확 API 직접 등록
app.post('/api/factory/harvest', async (req, res) => {
  const { kakaoId, cropType } = req.body;

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cropKey = cropType === 'potato' ? 'gamja' : 'bori';
    const growthKey = cropType === 'potato' ? 'potato' : 'barley';
    const currentGrowth = user.growth[growthKey] || 0;

    if (currentGrowth < 5) {
      return res.status(400).json({ success: false, message: 'Not enough growth to harvest' });
    }

    const rewardOptions = [3, 5, 7];
    const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)];

    user.storage[cropKey] = (user.storage[cropKey] || 0) + reward;
    user.growth[growthKey] = 0;

    await user.save();

    res.json({
      success: true,
      message: '수확 성공',
      reward,
      cropType,
      cropAmount: user.storage[cropKey],
      storage: user.storage,
      growth: user.growth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ (필요하다면 아래 코드 추가! → 물/거름/성장포인트 라우터)
// app.patch('/api/factory/use-resource', async (req, res) => { ... });


// ✅ 서버 실행
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
