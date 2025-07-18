// server-unified.js (중간 생략/필요부분만, 실제 통합운영)

require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// 모델
const User = require('./models/users');

// 라우터 등록
const factoryRoutes = require('./routes/factory');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userdataV2Routes = require('./routes/userdata_v2'); // ← 요게 v2data 라우터!

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mongo 연결 등은 기존 그대로

// 세션 설정 (생략)

app.use('/api/factory', factoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// ✅ 핵심! 상점 연동용 v2data 라우터 등록
app.use('/api/user/v2data', userdataV2Routes);

// 기존 /api/userdata 라우터도 유지(필요시)

const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
