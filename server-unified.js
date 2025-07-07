// server-unified.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3060;

app.use(express.static('public'));
app.use(express.json());

// ✅ 라우터 연결
const loginRoute = require('./routes/login');
const marketRoute = require('./routes/market');
const userRoute = require('./routes/user');           // ← 기존 유지
const userdataRoute = require('./routes/userdata');   // ✅ 새로 추가
const seedRoute = require('./routes/seed');
const initUserRoute = require('./routes/init-user');

app.use('/api/login', loginRoute);
app.use('/api/market', marketRoute);
app.use('/api/users', userRoute);          // ← 여전히 존재 가능
app.use('/api/userdata', userdataRoute);   // ✅ 정확한 라우터 추가
app.use('/api/seed', seedRoute);
app.use('/api/init-user', initUserRoute);

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
