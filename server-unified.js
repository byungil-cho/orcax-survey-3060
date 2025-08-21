const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ CORS (깃허브 페이지에서 요청 가능하도록 설정)
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true
}));

// ✅ 세션 (로그인 상태 유지용)
app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // https면 true
}));

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
  corn: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

// ✅ 로그인
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username });
    await user.save();
  }
  req.session.username = username;
  res.json({ success: true, user });
});

// ✅ 유저 자원 불러오기
app.get('/api/corn/summary/:username', async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ✅ 테스트용
app.get('/', (req, res) => res.send("Server is running!"));

app.listen(3060, () => console.log("Server running on port 3060"));








