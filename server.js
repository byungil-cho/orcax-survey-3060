const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();
const port = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());
// 정적 파일(HTML, JS) 제공
app.use(express.static(path.join(__dirname)));

/// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// 연결 상태 로깅
const db = mongoose.connection;
db.on('error', err => console.error('❌ MongoDB 연결 실패:', err));
db.once('open', () => console.log('✅ MongoDB 연결 성공!'));

const User = require('./models/User');

// 유저 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
      console.log('✅ 신규 유저 저장:', kakaoId);
    } else {
      console.log('ℹ️ 이미 등록된 유저:', kakaoId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('❌ saveUser 오류:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 유저 조회 API
app.get('/api/userdata', async (req, res) => {
  const { kakaoId } = req.query;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ userdata 오류:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
