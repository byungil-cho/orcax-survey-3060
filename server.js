const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 완료'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ Farm 모델 정의
const farmSchema = new mongoose.Schema({
  nickname: String,
  token: Number,
  inventory: Array
});
const Farm = mongoose.model('Farm', farmSchema);

// ✅ /api/userdata GET
app.get('/api/userdata', async (req, res) => {
  const { nickname } = req.query;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ message: "유저 없음" });
  res.json(user);
});

// ✅ /api/userdata POST
app.post('/api/userdata', async (req, res) => {
  const { nickname, token, inventory } = req.body;
  const updated = await Farm.findOneAndUpdate(
    { nickname },
    { token, inventory },
    { new: true }
  );
  res.json(updated);
});

// ✅ /api/market (🟢 이게 핵심!!)
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
