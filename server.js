require('dotenv').config(); // 최상단에 있어야 적용됨

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGODB_URL; // ✅ 통일된 환경변수명

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// ✅ 서버 상태 확인용 루트 경로
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Farm Backend is running");
});

// ✅ 사용자 데이터 라우트
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ✅ 초기 자산 지급 라우트
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
