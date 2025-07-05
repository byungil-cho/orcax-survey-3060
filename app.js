const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect("mongodb://localhost:27017/farmDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("✅ MongoDB 연결됨"));

// 씨앗 인벤토리 모델
const seedSchema = new mongoose.Schema({
  type: String,
  quantity: Number,
});
const SeedInventory = mongoose.model("SeedInventory", seedSchema);

// 초기 재고 설정 라우트 (1회 실행용)
app.post("/api/seed/init", async (req, res) => {
  await SeedInventory.deleteMany({});
  await SeedInventory.create([
    { type: "seedPotato", quantity: 100 },
    { type: "seedBarley", quantity: 100 },
  ]);
  res.send({ success: true, message: "초기 재고 설정 완료" });
});

// 재고 상태 확인
app.get("/api/seed/status", async (req, res) => {
  const seeds = await SeedInventory.find();
  const result = {};
  seeds.forEach((item) => {
    result[item.type] = item;
  });
  res.send(result);
});

// 씨앗 구매
app.post("/api/seed/purchase", async (req, res) => {
  const { type } = req.body;
  const seed = await SeedInventory.findOne({ type });
  if (!seed || seed.quantity <= 0) {
    return res.status(400).send({ success: false, message: "재고 부족" });
  }
  seed.quantity -= 1;
  await seed.save();
  res.send({ success: true, message: `${type} 1개 구매 완료` });
});

// 유저 정보 (더미)
app.get("/api/users/me", (req, res) => {
  res.send({ nickname: "감자킹", token: 10 });
});

// 서버 상태 체크용
app.get("/api/market", (req, res) => {
  res.send({ status: "ok" });
});

// 서버 실행
const PORT = 3060;
app.listen(PORT, () => console.log(`🚀 서버 실행 중 http://localhost:${PORT}`));
