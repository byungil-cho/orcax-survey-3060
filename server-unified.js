require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 라우터 연결
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userdata');
const farmRoutes = require('./routes/farm');
const seedRoutes = require('./routes/seed');
const initUserRoutes = require('./routes/init-user');
const userDataRoute = require('./routes/userdata');
const userRoutesV2 = require('./routes/userdata_v2');
const seedStatusRoute = require('./routes/seed-status');
const seedPriceRoute = require('./routes/seed-price');

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

// ✅ 핵심 API 경로 등록
app.use('/api/login', loginRoute); 
app.use('/api/userdata', userRoutes);
app.use('/api/userdata_v2', userRoutesV2);
app.use('/api/user/data', userRoutesV2); // ✅ 실질적으로 HTML이 호출하는 경로
app.use('/api/farm', farmRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/init-user', initUserRoutes);
app.use('/api/seed/status', seedStatusRoute);
app.use('/api/seed/price', seedPriceRoute);

// 루트 테스트
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Unified Backend is running");
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
