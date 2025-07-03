const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orcax-club';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));

// ✅ 사용자 조회 라우트 등록
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ✅ 사용자 업데이트 라우트 등록 ← 이게 없어서 POST /api/update-user가 안 됐던 거
const updateUserRoutes = require('./routes/update-user');
app.use('/api/update-user', updateUserRoutes);

// ✅ init-user 라우트 등록
const initUserRoutes = require('./routes/init-user');
app.use('/api/init-user', initUserRoutes);

// ✅ login 라우트 등록
const loginRoutes = require('./routes/login');
app.use('/api/login', loginRoutes);

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
