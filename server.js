const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const PORT = 3060;

// ✅ 환경설정
app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결 (이미 연결된 상태라 가정)
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결됨'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ /api/userdata 라우터 (기존)
const Farm = mongoose.model('Farm', new mongoose.Schema({
  nickname: String,
  token: Number,
  inventory: Array
}));

app.get('/api/userdata', async (req, res) => {
  const { nickname } = req.query;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ message: "유저 없음" });
  res.json(user);
});

app.post('/api/userdata', async (req, res) => {
  const { nickname, token, inventory } = req.body;
  const updated = await Farm.findOneAndUpdate(
    { nickname },
    { token, inventory },
    { new: true }
  );
  res.json(updated);
});

// ✅ 추가된 /api/market 라우터 (전광판 시세 제공)
app.get('/api/market', (req, res) => {
  res.json([
    { name: "감자칩", price: 15 },
    { name: "감자전", price: 20 },
    { name: "감자튀김", price: 30 }
  ]);
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 작동 중: http://localhost:${PORT}`);
});


