// 통합 서버 코드(server-unified.js)
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

let users = {};
let inventory = {
  seedPotato: 100,
  seedBarley: 100
};

app.post('/api/init-user', (req, res) => {
  const kakaoId = req.body.kakaoId;
  if (!users[kakaoId]) {
    users[kakaoId] = { nickname: req.body.nickname, tokens: 10 };
  }
  res.status(200).json(users[kakaoId]);
});

app.get('/api/userdata', (req, res) => {
  const kakaoId = req.query.kakaoId;
  if (users[kakaoId]) {
    res.status(200).json(users[kakaoId]);
  } else {
    res.status(404).send('User not found');
  }
});

app.get('/seed/status', (req, res) => {
  res.json(inventory);
});

app.post('/seed/purchase', (req, res) => {
  const { kakaoId, type } = req.body;
  if (!users[kakaoId]) return res.status(400).send('Invalid user');
  if (type === 'potato' && inventory.seedPotato > 0) {
    inventory.seedPotato--;
    return res.status(200).send('Purchased seed potato');
  } else if (type === 'barley' && inventory.seedBarley > 0) {
    inventory.seedBarley--;
    return res.status(200).send('Purchased seed barley');
  } else {
    return res.status(400).send('Out of stock');
  }
});

app.get('/market', (req, res) => {
  res.status(200).json({ items: [] }); // stub
});

app.get('/users/me', (req, res) => {
  const kakaoId = req.query.kakaoId;
  const user = users[kakaoId];
  if (!user) return res.status(404).send('User not found');
  res.status(200).json(user);
});

app.listen(3060, () => console.log('Server running on port 3060'));
