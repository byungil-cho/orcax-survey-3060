const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/orcax-club';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// ✅ 사용자 라우트 등록
const userdataRoutes = require('./routes/userdata');
app.use('/api/userdata', userdataRoutes);

// ❌ init-user 라우트는 삭제 (해당 파일은 서버 전체였음)

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
