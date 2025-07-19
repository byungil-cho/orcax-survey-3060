const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL;

const seedStockSchema = new mongoose.Schema({
  type: { type: String, unique: true },
  stock: Number,
  price: Number
});
const SeedStock = mongoose.model('SeedStock', seedStockSchema);

async function runMigration() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('✅ MongoDB 연결 성공');

    // 컬렉션 완전 삭제!
    await SeedStock.deleteMany({});
    // 또는 await SeedStock.collection.drop();

    console.log('🧹 기존 SeedStock 데이터 제거 완료');

    const seedData = [
      { type: 'gamja', stock: 100, price: 2 },
      { type: 'bori',  stock: 100, price: 2 }
    ];

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
