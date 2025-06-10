const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

// ✅ 미들웨어
app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 완료'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ Farm 스키마 정의
const farmSchema = new mongoose.Schema({
  nickname: String,
  token: Number,
  water: Number,
  fertilizer: Number,
  inventory: Array,
});
const Farm = mongoose.model('Farm', farmSchema);

// ✅ 유저 정보 GET
app.get('/api/userdata', async (req, res) => {
  try {
    const { nickname } = req.query;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ message: "유저 없음" });
    res.json(user);  // 통일된 응답 형식
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 유저 정보 POST (토큰, 인벤토리, 자원 업데이트)
app.post('/api/userdata', async (req, res) => {
  try {
    const { nickname, token, water, fertilizer, inventory } = req.body;
    const updated = await Farm.findOneAndUpdate(
      { nickname },
      { token, water, fertilizer, inventory },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "업데이트 실패" });
  }
});

// ✅ 감자 시세 전광판 API
app.get('/api/market', (req, res) => {
  res.json([
    { name: "감자칩", price: 15 },
    { name: "감자전", price: 20 },
    { name: "감자튀김", price: 30 }
  ]);
});

// ✅ 감자밭 서버 연결 확인용 루트 경로
app.get('/', (req, res) => {
  res.send('✅ OrcaX 감자 서버 정상 작동 중!');
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
