const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

// CORS 허용
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// Farm 모델 (닉네임 기반 유저)
const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  inventory: Array
});
const Farm = mongoose.model('Farm', farmSchema);

// ✅ /api/login 라우트 추가
app.post('/api/login', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ success: false, message: "닉네임이 없습니다." });
  }

  try {
    let user = await Farm.findOne({ nickname });
    if (!user) {
      user = await Farm.create({
        nickname,
        water: 10,
        fertilizer: 10,
        token: 5,
        potatoCount: 0,
        inventory: []
      });
      console.log(`🆕 신규 유저 등록: ${nickname}`);
    } else {
      console.log(`✅ 기존 유저 로그인: ${nickname}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ 로그인 처리 실패:", err);
    res.status(500).json({ success: false, message: "서버 에러" });
  }
});

// (예시) 사용자 정보 조회
app.get('/api/userdata', async (req, res) => {
  const nickname = req.query.nickname;
  const user = await Farm.findOne({ nickname });
  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false, message: "유저 없음" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버 작동 중 (포트 ${PORT})`);
});
