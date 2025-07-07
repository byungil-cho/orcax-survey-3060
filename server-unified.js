""// server-unified.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = express();
const port = 3060;

const loginRoute = require('./routes/login');
const marketRoute = require('./routes/market');
const userRoute = require('./routes/user');
const seedRoute = require('./routes/seed');

app.use(express.json());
app.use('/api/login', loginRoute);
app.use('/api/market', marketRoute);
app.use('/api/users', userRoute);
app.use('/api/seed', seedRoute);

mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});


// routes/login.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.status(200).json({ message: '로그인 성공' });
  } else {
    res.status(401).json({ message: '로그인 실패' });
  }
});

module.exports = router;


// routes/market.js
const express = require('express');
const router = express.Router();

// 예시 마켓 데이터
const dummyProducts = [
  { id: 1, name: '사과', price: 1000 },
  { id: 2, name: '바나나', price: 1500 }
];

router.get('/', (req, res) => {
  res.json(dummyProducts);
});

module.exports = router;


// routes/user.js
const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ id: 1, username: 'admin' });
});

module.exports = router;


// routes/seed.js
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;

