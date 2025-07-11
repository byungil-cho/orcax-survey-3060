require('dotenv').config(); // MONGODB_URL 불러오기

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3060;

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// ✅ 상태 점검용 루트 경로
app.get('/', (req, res) => {
  res.send('🌱 OrcaX 서버 정상 작동 중 (server-unified-fixed.js)');
});

// ✅ routes 연동
app.use('/api/init-user', require('./routes/init-user'));
app.use('/api/userdata', require('./routes/userdata'));
app.use('/api/login', require('./routes/login'));

// 🔄 향후 확장용
// app.use('/api/seed/status', require('./routes/seed-status'));
// app.use('/api/shop', require('./routes/shop'));

app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버 실행 중: http://localhost:${PORT}`);
});
