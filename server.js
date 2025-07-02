const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGO_URI; // 🔥 반드시 환경변수에서만 받아야 함

// ✅ MongoDB 연결
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// ✅ 서버 상태 확인용 루트 응답
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Farm Backend is running");
});

// ✅ 사용자 라우트 등록
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ✅ init-user 라우트 등록
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
