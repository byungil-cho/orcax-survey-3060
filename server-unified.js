const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3060;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("✅ MongoDB 연결 완료"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// Routes
const userdataRoutes = require('./routes/userdata');
const seedPriceRoutes = require('./routes/seed-price');
const seedStatusRoutes = require('./routes/seed-status');

app.use('/api/userdata', userdataRoutes);
app.use('/api/seed/price', seedPriceRoutes);
app.use('/api/seed/status', seedStatusRoutes);

// Server
app.listen(port, () => {
  console.log(`✅ 서버 실행 중 http://localhost:${port}`);
});
