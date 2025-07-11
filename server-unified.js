const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const seedRoutes = require('./routes/seed');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// 라우터 연결
app.use('/api/seed', seedRoutes);

// 서버 시작
mongoose.connect('your_mongo_url_here')
  .then(() => {
    console.log('✅ MongoDB 연결 완료');
    app.listen(PORT, () => {
      console.log(`✅ 서버 실행 중 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
  });
