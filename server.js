require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
const mongoURI = process.env.MONGODB_URL;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결 성공');
}).catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// 기본 확인용
app.get('/', (req, res) => {
  res.send('✅ 서버 정상 작동 중!');
});

// ✅ 사용자 라우터 연결
const userRoutes = require('./routes/user');
app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
