const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Express 앱 생성
const app = express();
// 배포용 PORT 설정
const port = process.env.PORT || 3060;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 사용자 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  try {
    const User = require('./models/User');
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
      console.log('New user saved:', kakaoId);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('saveUser error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 로그인 엔드포인트
app.post('/api/login', (req, res) => {
  return res.json({ success: true });
});

// 유저 조회 API
const userdataRouter = require('./routes/userdata');
app.use('/api/userdata', userdataRouter);

// 정적 파일 서빙 (프로젝트 루트)
app.use(express.static(__dirname));

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 서버 시작
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
