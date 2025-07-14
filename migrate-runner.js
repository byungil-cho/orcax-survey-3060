// migrate-runner.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL;

const seedStockSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  price: Number,
  seedType: String,
  type: {
    type: String,
    unique: true // 'gamja', 'bori' 등 구분자
  }
});

const SeedStock = mongoose.model('SeedStock', seedStockSchema);

async function runMigration() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('✅ MongoDB 연결 성공');

    // 기존 데이터 모두 삭제 (중복 방지)
    await SeedStock.deleteMany({});
    console.log('🧹 기존 SeedStock 데이터 제거 완료');

    // 마이그레이션 데이터
    const seedData = [
      {
        name: '씨감자',
        stock: 100,
        price: 2,
        seedType: '감자',
        type: 'gamja'
      },
      {
        name: '씨보리',
        stock: 100,
        price: 2,
        seedType: '보리',
        type: 'bori'
      }
    ];

    // 데이터 삽입
    const result = await SeedStock.insertMany(seedData);
    console.log('🚀 마이그레이션 완료:', result);
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err);
  } finally {
    await mongoose.disconnect();
    console.log('📴 MongoDB 연결 종료');
  }
}

runMigration();
