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
const userRoute = require('./routes/user');             // 세션 기반 route
const userdataRoute = require('./routes/userdata');     // MongoDB route for /api/userdata
const seedRoute = require('./routes/seed');
const initUserRoute = require('./routes/init-user');
const apiUserRoute = require('./api/user');             // ✅ REST API 기반 user.js

app.use('/api/login', loginRoute);
app.use('/api/market', marketRoute);
app.use('/api/users', userRoute);           // 세션 기반
app.use('/api/userdata', userdataRoute);    // Mongo 전용
app.use('/api/seed', seedRoute);
app.use('/api/init-user', initUserRoute);
app.use('/api/user', apiUserRoute);         // ✅ REST API (예: /api/user/userdata)

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
