require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3060;
const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

app.use(cors());
app.use(express.json());

// 사용자 라우트
const userRoutes = require('./routes/userdata');
app.use('/api/userdata', userRoutes);

// 농장 라우트
const farmRoutes = require('./routes/farm');
app.use('/api/farm', farmRoutes);

// 씨앗 보관소 라우트
const seedRoutes = require('./routes/seed');
app.use('/api/seed', seedRoutes);

// 초기 자산 지급
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

app.get("/", (req, res) => {
  res.send("🟢 OrcaX Unified Backend is running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
