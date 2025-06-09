const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const PORT = 3060;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/orcax';

app.use(cors());
app.use(express.json());

// 몽고 연결
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err);
});

// Farm 모델
const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number
});
const Farm = mongoose.model('Farm', farmSchema);

// 🟢 기본 페이지
app.get('/', (req, res) => {
  res.send('Welcome to OrcaX Farm API');
});

// ✅ ping
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// ✅ 유저 데이터
app.get('/api/userdata', async (req, res) => {
  try {
    const users = await Farm.find({}, 'nickname water fertilizer token potatoCount');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
