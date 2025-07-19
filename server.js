const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/orcax-club';

// ✅ MongoDB 연결
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());
app.use("/api/seed", require("./routes/seed-status"));
app.use("/api/seed", require("./routes/seed"));

// ✅ /api/userdata 라우트 연결
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ✅ /api/init-user 라우트 연결
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

// ✅ /api/login 라우트 직접 정의
app.post('/api/login', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId is required' });

  try {
    const User = require('./models/User');
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname: '신규 유저',
        orcx: 10,
        water: 10,
        fertilizer: 10,
        seedPotato: 0,
        seedBarley: 0,
        potatoCount: 0,
        barleyCount: 0,
        harvestCount: 0,
        inventory: [],
        lastLogin: new Date(),
        lastRecharge: new Date()
      });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ login API 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
