const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ✅ 루트 기본 응답 (서버 전원 체크용)
app.get("/", (req, res) => {
  res.send("OrcaX 서버 작동 중 ✅");
});

// ✅ MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// ✅ Farm 모델 정의
const farmSchema = new mongoose.Schema({
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potatoCount: Number,
  inventory: Array
});
const Farm = mongoose.model('Farm', farmSchema);

// ✅ /api/login - 유저 등록
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

// ✅ /api/userdata - 유저 데이터 조회
app.get('/api/userdata', async (req, res) => {
  const nickname = req.query.nickname;
  try {
    const user = await Farm.findOne({ nickname });
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: "유저 없음" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 에러" });
  }
});

// ✅ /api/use-resource - 물/거름 사용
app.post('/api/use-resource', async (req, res) => {
  const { nickname, type } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.json({ success: false, message: "유저 없음" });

  if (type === 'water' && user.water > 0) user.water--;
  if (type === 'fertilizer' && user.fertilizer > 0) user.fertilizer--;

  await user.save();
  res.json({ success: true });
});

// ✅ /api/harvest - 감자 수확
app.post('/api/harvest', async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.json({ success: false, message: "유저 없음" });

  const harvested = 3; // 예: 3개 수확
  user.potatoCount += harvested;
  await user.save();
  res.json({ success: true, harvested });
});

// ✅ /api/update-user - 전체 유저 상태 저장
app.post('/api/update-user', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.json({ success: false, message: "닉네임 없음" });

  try {
    await Farm.findOneAndUpdate({ nickname }, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "업데이트 실패" });
  }
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버 실행 중 - 포트 ${PORT}`);
});


