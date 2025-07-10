const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB 연결 완료');
}).catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err);
});

// 📦 유저 모델 불러오기
const User = require('./models/User');

// ✅ 유저 초기화
app.post('/api/init-user', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        farmName: `${nickname}의 농장`,
        water: 10,
        fertilizer: 10,
        orcx: 10,
        potato: 0,
        barley: 0,
        level: 1,
        totalFarmingCount: 0
      });
      await user.save();
      console.log(`[🆕 유저 생성]: ${nickname}`);
    }

    res.json({ message: '유저 초기화 완료', success: true });
  } catch (err) {
    console.error('❌ /api/init-user 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 유저 조회
app.get('/api/userdata', async (req, res) => {
  const { kakaoId } = req.query;

  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId 쿼리 필요' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    // 없으면 생성
    if (!user) {
      user = new User({
        kakaoId,
        nickname: "신규 사용자",
        farmName: "신규 농장",
        water: 10,
        fertilizer: 10,
        orcx: 10,
        potato: 0,
        barley: 0,
        level: 1,
        totalFarmingCount: 0
      });
      await user.save();
    }

    res.json({ user });
  } catch (err) {
    console.error('❌ /api/userdata 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 통합 자원 저장 API
app.post('/api/update-user', async (req, res) => {
  const { kakaoId, potato, barley, water, fertilizer, orcx } = req.body;

  if (!kakaoId) {
    return res.status(400).json({ error: 'kakaoId는 필수입니다.' });
  }

  try {
    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    // 존재하는 값만 업데이트
    if (typeof potato === 'number') user.potato = potato;
    if (typeof barley === 'number') user.barley = barley;
    if (typeof water === 'number') user.water = water;
    if (typeof fertilizer === 'number') user.fertilizer = fertilizer;
    if (typeof orcx === 'number') user.orcx = orcx;

    await user.save();

    res.json({ success: true, message: '자원 업데이트 완료', user });
  } catch (err) {
    console.error('❌ /api/update-user 오류:', err);
    res.status(500).json({ error: '자원 업데이트 실패' });
  }
});

// ✅ 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
