const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');
require('dotenv').config(); // .env 로딩

const userdataRouter = require('./userdata');
const initUserRouter = require('../routes/init-user');
const User = require('./models/User');
const app = express();
const port = process.env.PORT || 3060;

// 미들웨어
app.use(cors());
app.use(express.json());

// ✅ 사용자 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;

  // 닉네임이나 아이디 누락 시 저장 중단
  if (!kakaoId || !nickname) {
    console.warn("❗ 누락된 정보로 인해 유저 저장 실패:", req.body);
    return res.status(400).json({ success: false, message: "닉네임 또는 카카오 ID 누락" });
  }

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
      console.log('✅ 신규 유저 저장:', kakaoId, nickname);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ saveUser 오류:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 로그인 API
app.post('/api/login', async (req, res) => {
  const { kakaoId } = req.body;
  try {
    console.log("🔍 로그인 시도:", kakaoId);
    const user = await User.findOne({ kakaoId });
    if (user) {
      console.log("✅ 로그인 성공:", user.nickname);
      return res.json({ success: true, user });
    } else {
      console.log("❌ 유저 없음:", kakaoId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('❌ login 오류:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 유저 조회 API
app.use('/api/userdata', userdataRouter);

// ✅ init-user 라우터 연결
app.use('/api/init-user', initUserRouter);

// ✅ 정적 파일 제공
app.use(express.static(path.join(__dirname)));

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', err => console.error('❌ MongoDB 연결 실패:', err));
db.once('open', () => console.log('✅ MongoDB 연결 성공!'));

// ✅ 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
