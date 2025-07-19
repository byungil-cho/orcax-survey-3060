// 통합 app.js 수정된 버전

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3060;

app.use(cors());
app.use(express.json());
app.use("/api/seed", require("./routes/seed-status"));

// 임시 메모리 저장소
let users = {};
let seedStock = {
  potato: 10,
  sprout: 5
};

// 유저 정보 초기화
app.post('/api/init-user', (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) {
    users[userId] = {
      nickname: `User_${userId.substring(0, 5)}`,
      inventory: {
        seed: 0,
        sprout: 0
      },
      tokens: 10
    };
  }
  res.status(200).send();
});

// 유저 정보 요청
app.get('/api/users/me', (req, res) => {
  const userId = req.query.userId;
  const user = users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ nickname: user.nickname });
});

// 유저 데이터 요청
app.get('/api/userdata', (req, res) => {
  const userId = req.query.userId;
  const user = users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// 시장 정보
app.get('/api/market', (req, res) => {
  res.json(seedStock);
});

// 씨감자 상태
app.get('/api/seed/status', (req, res) => {
  res.json(seedStock);
});

// 씨감자 구매
app.post('/api/seed/purchase', (req, res) => {
  const { userId, type } = req.body;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!seedStock[type] || seedStock[type] <= 0) {
    return res.status(400).json({ error: 'Seed out of stock' });
  }
  if (user.tokens <= 0) {
    return res.status(400).json({ error: 'Not enough tokens' });
  }

  user.inventory[type] += 1;
  user.tokens -= 1;
  seedStock[type] -= 1;

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
