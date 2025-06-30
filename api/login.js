const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const userdataRouter = require('./routes/userdata');
const app = express();
const port = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());

// 1) 유저 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  try {
    let User = require('./models/User');
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ saveUser 오류:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2) 유저 조회 API
app.use('/api/userdata', userdataRouter);

// 3) 정적 파일 제공 (API 처리 후)
app.use(express.static(path.join(__dirname)));

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
