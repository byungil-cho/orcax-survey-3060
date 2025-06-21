
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3060;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB 연결 성공");
}).catch((err) => {
  console.error("❌ MongoDB 연결 실패:", err);
});

const userSchema = new mongoose.Schema({
  nickname: String,
  potatoCount: Number,
  barleyCount: Number,
  water: Number,
  fertilizer: Number,
  token: Number,
  seedCount: Number,
  barleySeedCount: Number,
  potatoProductCount: Number,
  barleyProductCount: Number,
  harvestCount: Number,
});

const User = mongoose.model('User', userSchema);

app.get('/api/userdata', async (req, res) => {
  const nickname = req.query.nickname;
  if (!nickname) return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });

  const user = await User.findOne({ nickname });
  if (!user) return res.status(404).json({ success: false, message: '유저 없음' });

  res.json({
    nickname: user.nickname,
    potatoCount: user.potatoCount,
    barleyCount: user.barleyCount,
    water: user.water,
    fertilizer: user.fertilizer,
    token: user.token,
    seedCount: user.seedCount,
    barleySeedCount: user.barleySeedCount,
    potatoProductCount: user.potatoProductCount,
    barleyProductCount: user.barleyProductCount,
    harvestCount: user.harvestCount
  });
});

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
