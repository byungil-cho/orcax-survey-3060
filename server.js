const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결됨'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// Farm 모델 정의
const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  seedPotato: Number
});
const Farm = mongoose.model('Farm', farmSchema);

/* ========== 로그인: 최초 로그인 시 자산 지급 (무료 농사 제거됨) ========== */
app.post('/api/login', async (req, res) => {
  const { nickname } = req.body;
  let user = await Farm.findOne({ nickname });
  if (!user) {
    user = await Farm.create({
      nickname,
      water: 10,
      fertilizer: 10,
      token: 10,
      potatoCount: 0,
      seedPotato: 2
    });
  }
  res.json({ success: true, user });
});

/* ========== 씨감자 사용 ========== */
app.post('/api/use-seed', async (req, res) => {
  const { nickname } = req.body;
  try {
    const user = await Farm.findOne({ nickname });
    if (!user || user.seedPotato <= 0) {
      return res.json({ success: false, message: '씨감자가 부족합니다.' });
    }
    const updated = await Farm.findOneAndUpdate(
      { nickname, seedPotato: { $gte: 1 } },
      { $inc: { seedPotato: -1 } },
      { new: true }
    );
    res.json({ success: true, message: '씨감자 차감 완료', seedPotato: updated.seedPotato });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

/* ========== 전체 사용자 조회 ========== */
app.get('/api/users', async (req, res) => {
  try {
    const users = await Farm.find({}, 'nickname water fertilizer token potatoCount seedPotato');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

/* ========== 단일 유저 조회 ========== */
app.get('/api/userdata', async (req, res) => {
  const { nickname } = req.query;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 필요합니다.' });
  }

  try {
    const user = await Farm.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
