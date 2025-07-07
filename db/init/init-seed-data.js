// init-seed-data.js
const mongoose = require('mongoose');

// Replace with your actual MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/OrcaX';

// Define seed schema (adjust field names/types based on your existing schema)
const seedSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  quantity: Number,
});

const Seed = mongoose.model('Seed', seedSchema);

// Initial seed data
const seedData = [
  { name: '씨감자', type: '감자', price: 10, quantity: 100 },
  { name: '씨보리', type: '보리', price: 8, quantity: 100 },
];

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB 연결 성공. 초기 데이터를 삽입합니다.');
    return Seed.insertMany(seedData);
  })
  .then(() => {
    console.log('✅ 씨앗 초기 데이터 삽입 완료! 이제 감자밭에 씨를 뿌릴 수 있습니다.');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('❌ 에러 발생:', err);
    mongoose.disconnect();
  });
