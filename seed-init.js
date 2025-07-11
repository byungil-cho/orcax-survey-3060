// seed-init.js (한 번 실행하고 삭제해도 됩니다)
const mongoose = require("mongoose");
require("dotenv").config();

const SeedInventory = require("./models/SeedInventory");

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  await SeedInventory.findByIdAndDelete("singleton");

  await SeedInventory.create({
    _id: "singleton", // 반드시 이 ID여야 합니다!
    seedPotato: {
      quantity: 100,
      price: 2
    },
    seedBarley: {
      quantity: 100,
      price: 2
    }
  });

  console.log("✅ 씨앗 초기 데이터 삽입 완료 (SeedInventory)");
  mongoose.disconnect();
})
.catch((err) => {
  console.error("❌ MongoDB 연결 실패", err);
});
