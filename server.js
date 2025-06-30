
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());

// 캐시 방지
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// 사용자 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  if (!kakaoId) {
    return res.status(400).json({ success: false, error: 'kakaoId is required' });
  }

  try {
    const User = require('./models/User');
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer });
      await user.save();
      console.log('✅ New user saved:', kakaoId);
    } else {
      console.log('ℹ️ User already exists:', kakaoId);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ saveUser error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 유저 조회 API
app.get('/api/userdata', async (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (!kakaoId) {
    return res.status(400).json({ success: false, error: 'kakaoId missing' });
  }

  try {
    const User = require('./models/User');
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, user: null });
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ userdata error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 정적 파일 제공 (필요시)
app.use(express.static(__dirname));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
