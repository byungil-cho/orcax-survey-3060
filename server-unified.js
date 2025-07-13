require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 라우터 연결
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userdata');            // V1
const userdataV2 = require('./routes/userdata_v2');         // V2
const farmRoutes = require('./routes/farm');
const seedRoutes = require('./routes/seed');
const initUserRoutes = require('./routes/init-user');
const seedStatusRoute = require('./routes/seed-status');
const seedPriceRoute = require('./routes/seed-price');
const seedReturnRoute = require('./routes/seed-return');
const seedReturnRoute = require('./routes/seed-return');

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

// 경로 등록
app.use('/api/login', loginRoute);
app.use('/api/userdata', userRoutes);                     // V1
app.use('/api/user/v2data', userdataV2);                  // ✅ V2
app.use('/api/farm', farmRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/init-user', initUserRoutes);
app.use('/api/seed/status', seedStatusRoute);
app.use('/api/seed/price', seedPriceRoute);
app.use('/api/seed/buy', seedBuyRoute);
app.use('/api/seed/return', seedReturnRoute);

// 테스트
app.get("/", (req, res) => {
  res.send("🟢 OrcaX Unified Backend is running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
