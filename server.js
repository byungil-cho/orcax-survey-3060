const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3060;

// ✅ 미들웨어
app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결됨'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ 전기 상태 라우터
app.get('/api/status', (req, res) => {
  res.status(200).send('🟢 서버 작동 중');
});
app.get('/api/power', (req, res) => {
  res.json({ power: true });
});

// ✅ 감자 라우터 연결
const farmRoutes = require('./routes/farm');
app.use('/api', farmRoutes);

// ✅ 제품 라우터 (감자/보리 공통)
const productRoutes = require('./routes/product');
app.use('/api', productRoutes);

// ✅ 보리 라우터 추가
const barleyRoutes = require('./routes/barley');
app.use('/api', barleyRoutes);

// ✅ 관리자, 마켓 등 (추후 확장)
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const productRouter = require("./routes/product");

app.use("/api", productRouter);
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
app.use('/api', marketRoutes);

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중 : http://localhost:${PORT}`);
});
