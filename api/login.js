// ✅ [1] server.js 수정 - POST /api/saveUser 추가
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// 기존 GET API
app.get('/api/userdata', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ✅ 신규 POST API 추가
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  try {
    const existing = await User.findOne({ kakaoId });
    if (!existing) {
      const newUser = new User({
        kakaoId,
        nickname,
        orcx,
        water,
        fertilizer,
        seedPotato: 0,
        potatoCount: 0,
        seedBarley: 0,
        barleyCount: 0,
        harvestCount: 0,
        inventory: [],
        lastRecharge: new Date()
      });
      await newUser.save();
      console.log("✅ 유저 저장 완료:", kakaoId);
    } else {
      console.log("ℹ️ 이미 등록된 유저:", kakaoId);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ 저장 실패:", error);
    res.status(500).json({ success: false });
  }
});

mongoose.connect('mongodb://127.0.0.1:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결 완료');
  app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
}).catch(err => console.error('❌ MongoDB 연결 실패:', err));
