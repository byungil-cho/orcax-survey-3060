const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // HTML 정적 서비스

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 완료"))
.catch((err) => console.error("❌ MongoDB 연결 실패", err));

// 🔌 라우터 등록
app.use('/api/login', require('./routes/login'));
app.use('/api/init-user', require('./routes/init-user'));
app.use('/api/userdata', require('./routes/userdata'));
app.use('/api/seed/status', require('./routes/seed-status'));
app.use('/api/seed', require('./routes/seed-buy')); // /buy 포함
app.use('/api/seed/price', require('./routes/seed-price'));

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 : http://localhost:${PORT}`);
});
