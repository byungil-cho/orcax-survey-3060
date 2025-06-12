const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3060;

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결됨'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

app.use(cors());
app.use(express.json());

// 👉 모델 불러오기
const { Farm, BarleyProduct } = require('./models/Farm'); // 통합된 Farm.js 사용

// 👉 기존 감자 라우터 유지
const gamjaRoutes = require('./routes/gamja');
app.use('/api', gamjaRoutes);

// ✅ 보리 수확 API 추가 (NEW)
app.post('/api/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;
  if (!nickname || !amount) {
    return res.json({ success: false, message: "필수값 누락" });
  }

  try {
    let user = await Farm.findOne({ nickname });
    if (!user) {
      user = await Farm.create({
        nickname,
        barley: 0,
        water: 10,
        fertilizer: 10,
        token: 5,
        potatoCount: 0,
      });
    }

    user.barley += Number(amount);
    await user.save();

    res.json({ success: true, amount });
  } catch (err) {
    console.error("❌ 수확 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 유저 기본 데이터 조회 (감자/보리 겸용)
app.get('/api/userdata/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  let user = await Farm.findOne({ nickname });

  if (!user) {
    user = await Farm.create({
      nickname,
      barley: 0,
      water: 10,
      fertilizer: 10,
      token: 5,
      potatoCount: 0,
    });
  }

  res.json({ user });
});

// ✅ 전기 상태 확인용
app.get('/api/status', (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중 → http://localhost:${PORT}`);
});
