require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 라우터 연결
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userdata');
const userRoutesV2 = require('./routes/userdata_v2');
const initUserRoutes = require('./routes/init-user');
const farmRoutes = require('./routes/farm');
const seedRoutes = require('./routes/seed');
const seedStatusRoute = require('./routes/seed-status');
const seedPriceRoute = require('./routes/seed-price');
const migrateRoute = require('./routes/migrate');

const app = express();
const PORT = process.env.PORT || 3060;
const MONGODB_URL = process.env.MONGODB_URL;

// ✅ MongoDB 연결
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

app.use(cors());
app.use(express.json());

// ✅ API 라우팅
app.use('/api/login', loginRoute);
app.use('/api/userdata', userRoutes);

// ★★★ 수정: V2 라우트 경로를 클라이언트와 동일하게! ★★★
app.use('/api/user/v2data', userRoutesV2);

app.use('/api/init-user', initUserRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/seed/status', seedStatusRoute);
app.use('/api/seed/price', seedPriceRoute);
app.use('/api/migrate', migrateRoute);
app.use('/api/seed', require('./routes/seed'));
app.use('/api/factory', require('./routes/factory'));

// ✅ 서버 전원 상태 확인용 Ping API
app.get('/api/ping', (req, res) => {
  res.status(200).send("🟢 Ping 정상 작동 중");
});

// ✅ 루트 상태 메시지
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Unified Backend is running");
});
// ✅ 서버 실행
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;


