const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 3060;

dotenv.config();

// 미들웨어
app.use(cors());
app.use(express.json()); // ✅ JSON 파싱 설정 중요
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch((err) => console.error('❌ MongoDB 연결 실패:', err));

// 라우터 연결
const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const authRouter = require('./routes/auth');

app.use('/api/init-user', initUserRouter);
app.use('/api/userdata', userDataRouter);
app.use('/api/auth', authRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
