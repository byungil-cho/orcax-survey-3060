const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const SeedStock = require('./models/SeedStock'); // 경로 확인 필요

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await SeedStock.deleteMany({});
    await SeedStock.insertMany([
      { name: '씨감자', stock: 100, price: 2, seedType: '감자' },
      { name: '씨보리', stock: 100, price: 2, seedType: '보리' },
    ]);

    console.log('✅ Migration 완료');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration 실패:', err);
    process.exit(1);
  }
}

migrate();
