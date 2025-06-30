const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();
const port = 3060;

// 미들웨어
app.use(cors());
app.use(express.json());
// 정적 파일 제공 (index9.html 등은 루트에 그대로 두고, 필요 시 경로 조정)
app.use(express.static(path.join(__dirname)));

mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

// 유저 저장 API
app.post('/api/saveUser', async (req, res) => {
  const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, orcx, water, fertilizer,
        seedPotato:0, potatoCount:0,
        seedBarley:0, barleyCount:0,
        harvestCount:0, inventory:[], lastRecharge: new Date()
      });
      await user.save();
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

// 유저 조회 API
app.get('/api/userdata', async (req, res) => {
  const { kakaoId } = req.query;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
