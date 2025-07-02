require('dotenv').config(); // ✅ 가장 위에 위치해야 함

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// ✅ 서버 상태 체크용 루트 경로
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Farm Backend is running");
});

// ✅ 감자밭/보리밭 공통 경로 유지
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
