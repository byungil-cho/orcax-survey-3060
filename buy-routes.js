// server-unified.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3060;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'orcax_secret',
    resave: false,
    saveUninitialized: true
}));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// API 라우트 불러오기
const loginRoutes = require('./api/login');
const farmRoutes = require('./api/farm');
const marketRoutes = require('./api/market');
const processingRoutes = require('./api/processing');
const purchaseRoutes = require('./api/purchase');
const seedBankRoutes = require('./api/seedBank');

// 🔹 추가: buy-routes.js 연결
const buyRoutes = require('./routes/buy-routes');

// 라우터 적용
app.use('/api/login', loginRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/seedBank', seedBankRoutes);

// 🔹 buy-routes.js API 엔드포인트 적용
app.use('/api/buy', buyRoutes);

// 서버 상태 체크
app.get('/', (req, res) => {
    res.send({ status: 'OK', db: mongoose.connection.readyState === 1 });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
