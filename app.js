const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./auth');
const userRoutes = require('./user');
const seedRoutes = require('./seed');
const marketRoutes = require('./market');
const userdataRoutes = require('./userdata-route');
const initUserRoutes = require('./init-user');
const purchaseRoutes = require('./purchase');
const seedReturnRoutes = require('./seed-return');
const updateUserRoutes = require('./update-user');
const farmRoutes = require('./farm');
const harvestRoutes = require('./harvest');
const withdrawRoutes = require('./withdraw');
const processingRoutes = require('./processing');
const useTokenRoutes = require('./use-token');
const seedBankRoutes = require('./seedBank');
const userInventoryRoutes = require('./UserInventory');
const seedInventoryRoutes = require('./SeedInventory');
const newUserSampleRoutes = require('./newUserSample');

const app = express();

dotenv.config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('✅ MongoDB 연결 성공');
});

// ✅ CORS 설정 수정
app.use(cors({
  origin: 'https://byungil-cho.github.io',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/userdata', userdataRoutes);
app.use('/api/init-user', initUserRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/seed-return', seedReturnRoutes);
app.use('/api/update-user', updateUserRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/use-token', useTokenRoutes);
app.use('/api/seed-bank', seedBankRoutes);
app.use('/api/user-inventory', userInventoryRoutes);
app.use('/api/seed-inventory', seedInventoryRoutes);
app.use('/api/sample', newUserSampleRoutes);

const PORT = process.env.PORT || 3060;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 : http://localhost:${PORT}`);
});
