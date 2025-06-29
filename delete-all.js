const mongoose = require('mongoose');

const MONGO_URL = 'mongodb://localhost:27017/orcax-survey-3060'; // ← 실제 연결 주소로 수정

mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log("✅ MongoDB 연결 성공. 데이터 삭제 시작...");

    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('storages').deleteMany({});
    await mongoose.connection.collection('exchangeLogs').deleteMany({});
    await mongoose.connection.collection('withdraws').deleteMany({});
    await mongoose.connection.collection('inventories').deleteMany({});

    console.log("🔥 모든 유저 관련 데이터 삭제 완료!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });
