const mongoose = require('mongoose');
const SeedStatus = require('./models/SeedStatus');
const SeedPrice = require('./models/SeedPrice');

const MONGODB_URL = 'your_mongo_url_here';

(async () => {
  await mongoose.connect(MONGODB_URL);
  console.log('✅ MongoDB 연결 성공');

  await SeedStatus.deleteMany();
  await SeedPrice.deleteMany();

  await SeedStatus.create({ potato: 100, barley: 50 });
  await SeedPrice.create({ potato: 2, barley: 3 });

  console.log('🌱 씨앗 수량 및 가격 초기화 완료!');
  process.exit();
})();
