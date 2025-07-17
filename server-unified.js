// server-unified.js - 전체 기능 포함, 수확 라우트 추가 버전

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/users');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// 라우터들
const factoryRoutes = require('./routes/factory');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/farmgame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/farmgame' }),
  })
);

// API 경로들
app.use('/api/factory', factoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// 🌾 수확 라우트 - 성장포인트 초기화 & 저장소 반영
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

// 서버 시작
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
