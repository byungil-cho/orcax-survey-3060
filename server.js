const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const userdataRoutes = require('./routes/userdata');
const initUserRoutes = require('./routes/init-user');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3060;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 연결
app.use('/api/auth', authRoutes);
app.use('/api/userdata', userdataRoutes);
app.use('/api/init-user', initUserRoutes);

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🚀 서버 실행 중:', `http://localhost:${PORT}`);
  console.log('🎉 서비스가 제공됩니다 🎉');
  console.log('==> 기본 URL에서 사용 가능 https://orcax-survey-3060.onrender.com');
});
