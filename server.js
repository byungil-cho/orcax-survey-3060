
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3060;
const MONGODB_URI = process.env.MONGODB_URI;

const User = require('./models/User');

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 로그인 라우터 추가
app.post('/api/user/login', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });
  }

  let user = await User.findOne({ nickname });
  if (!user) {
    user = new User({
      nickname,
      potatoCount: 0,
      barleyCount: 0,
      water: 10,
      fertilizer: 10,
      token: 10,
      seedCount: 2,
      barleySeedCount: 0,
      potatoProductCount: 0,
      barleyProductCount: 0,
      harvestCount: 0
    });
    await user.save();
    console.log(`✅ 신규 유저 생성: ${nickname}`);
  }

  res.json({ success: true, message: '로그인 완료', nickname: user.nickname });
});

// 유저 데이터 요청 라우터
app.get('/api/userdata', async (req, res) => {
  const { nickname } = req.query;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });
  }

  const user = await User.findOne({ nickname });
  if (!user) {
    return res.status(404).json({ success: false, message: '유저 없음' });
  }

  res.json(user);
});
app.get("/api/user/:nickname", async (req, res) => {
  const { nickname } = req.params;
  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      nickname: user.nickname,
      token: user.token,
      seed_potato: user.seed_potato,
      seed_barley: user.seed_barley,
      water: user.water,
      fertilizer: user.fertilizer,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
