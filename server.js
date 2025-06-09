const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farm');
const productRoutes = require('./routes/product');
const marketRoutes = require('./routes/market');
const adminRoutes = require('./routes/admin');

app.use('/api', authRoutes);
app.use('/api', farmRoutes);
app.use('/api', productRoutes);
app.use('/api', marketRoutes);
app.use('/api', adminRoutes);

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB 연결 완료');
    app.listen(PORT, () => console.log(`🚀 서버 작동 중: 포트 ${PORT}`));
}).catch(err => console.error('❌ MongoDB 연결 실패:', err));
