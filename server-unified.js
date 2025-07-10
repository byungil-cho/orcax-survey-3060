
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3060;
const mongoURI = process.env.MONGODB_URL;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err.message));

app.use(cors());
app.use(express.json());

// 모델 정의
const UserSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  power: Number,
  seed: Number,
  orcx: Number,
  water: Number,
  fertilizer: Number
});
const User = mongoose.model('User', UserSchema);

// API - 상태 확인
app.get('/', (req, res) => {
  res.send('🟢 OrcaX 서버 작동 중');
});

// API - 유저 정보 조회
app.get('/api/users/me', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) return res.status(400).json({ error: 'kakaoId 쿼리 필요' });

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: '유저 없음' });

    const { nickname, power, seed, orcx, water, fertilizer } = user;
    res.json({ nickname, power, seed, token: orcx, water, fertilizer });
  } catch (err) {
    console.error('/users/me error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
