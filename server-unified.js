// 📦 Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3060;

// 🌱 Middleware
app.use(cors());
app.use(bodyParser.json());

// 🌐 MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// 📦 예제 라우터 연결 (파일별로 나누었다면 require 해서 연결)
const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const marketRouter = require('./routes/market');
const seedRouter = require('./routes/seed');
const shopRouter = require('./routes/shop');

app.use('/api/init-user', initUserRouter);
app.use('/api/userdata', userDataRouter);
app.use('/market', marketRouter);
app.use('/seed', seedRouter);
app.use('/shop', shopRouter);

// ✅ /users/me용 개별 라우터 추가
const usersRouter = express.Router();
const User = require('./models/User');

usersRouter.get('/me', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId 쿼리 필요' });
  }

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ error: '유저 없음' });
    }

    const { nickname, power, seed, token } = user;
    res.json({ nickname, power, seed, token });
  } catch (err) {
    console.error('/users/me error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.use('/users', usersRouter);

// 🛠 기본 라우터
app.get('/', (req, res) => {
  res.send('🌽 OrcaX 감자 서버가 살아있다');
});

// 🚀 서버 시작
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
