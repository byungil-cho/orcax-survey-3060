require('dotenv').config(); // 반드시 최상단

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGODB_URL; // ✅ 변수명 통일

// ✅ MongoDB 연결
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

// ✅ 기본 설정
app.use(cors());
app.use(express.json());

// ✅ 루트 경로 서버상태 확인용
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Farm Backend is running");
});

// ✅ 사용자 라우트 연결
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ✅ 초기 자산 지급 라우트 연결
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

// ✅ 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
