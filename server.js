// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3060;

app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

const User = require('./models/User');

const initUserRouter = require('./routes/init-user');
app.use('/api/init-user', initUserRouter);

const loginRouter = require('./api/login');
app.use('/api/login', loginRouter);

const userdataRouter = require('./api/userdata');
app.use('/api/userdata', userdataRouter);

app.listen(port, () => {
  console.log(`🌱 서버 실행 중: http://localhost:${port}`);
});
