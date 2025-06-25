require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user');

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB 연결 완료"))
  .catch(err => console.error("MongoDB 연결 실패:", err));

app.use('/api/user', userRoutes);

const PORT = 3060;
app.listen(PORT, () => console.log(`서버 실행 중: 포트 ${PORT}`));