// server-unified.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3060;

app.use(express.static('public'));
const loginRoute = require('./routes/login');
const marketRoute = require('./routes/market');
const userRoute = require('./routes/user');
const seedRoute = require('./routes/seed');

app.use(express.json());
app.use('/api/login', loginRoute);
app.use('/api/market', marketRoute);
app.use('/api/users', userRoute);
app.use('/api/seed', seedRoute);

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});


// routes/login.js
const loginRouter = require('express').Router();

loginRouter.post('/', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.status(200).json({ message: '로그인 성공' });
  } else {
    res.status(401).json({ message: '로그인 실패' });
  }
});

module.exports = loginRouter;


// routes/market.js
const marketRouter = require('express').Router();

const dummyProducts = [
  { id: 1, name: '사과', price: 1000 },
  { id: 2, name: '바나나', price: 1500 }
];

marketRouter.get('/', (req, res) => {
  res.json(dummyProducts);
});

module.exports = marketRouter;


// routes/user.js
const userRouter = require('express').Router();

userRouter.get('/me', (req, res) => {
  res.json({ id: 1, username: 'admin' });
});

module.exports = userRouter;


// routes/seed.js
const seedRouter = require('express').Router();

seedRouter.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = seedRouter;


// public/js/market.js
document.querySelectorAll(".purchase-button").forEach((button) => {
  button.addEventListener("click", () => {
    alert("구매 완료!");
  });
});
