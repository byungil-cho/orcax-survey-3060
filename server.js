const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3060;

// ✅ MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결됨'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

app.use(cors());
app.use(express.json());

// ✅ 감자 경로는 건들지 않음 (단, 실제 존재해야 작동 가능)
const gamjaRoutes = require('./routes/gamja'); // 🔒 감자 유지
app.use('/api', gamjaRoutes);

// ✅ 보리 수확 API (추가만)
const { Farm } = require('./models/Farm');
app.post('/api/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;
  if (!nickname || !amount) {
    return res.json({ success: false, message: "필수값 누락" });
  }

  try {
    let user = await Farm.findOne({ nickname });
    if (!user) {
      user = await Farm.create({ nickname, barley: 0 });
    }

    user.barley += Number(amount);
    await user.save();

    res.json({ success: true, amount });
  } catch (err) {
    console.error("❌ 수확 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 기타 유지
app.get('/api/userdata/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  let user = await Farm.findOne({ nickname });

  if (!user) {
    user = await Farm.create({ nickname, barley: 0 });
  }

  res.json({ user });
});

app.get('/api/status', (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
