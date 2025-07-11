// seed-init.js (한 번 실행 후 삭제해도 됩니다)
const mongoose = require("mongoose");
const SeedStock = require("./models/SeedStock");

require("dotenv").config(); // MONGODB_URL 사용

mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    await SeedStock.deleteMany({});
    await SeedStock.insertMany([
      { type: "seedPotato", quantity: 100 },
      { type: "seedBarley", quantity: 100 }
    ]);
    console.log("✅ 씨앗 초기 데이터 삽입 완료");
    mongoose.disconnect();
  })
  .catch(err => console.error("❌ DB 연결 실패", err));
