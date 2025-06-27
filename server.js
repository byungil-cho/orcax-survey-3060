require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공"))
.catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ 유저 라우터 연결
const userRouter = require('./routes/user');
app.use('/api/user', userRouter);

// ✅ 기본 루트 테스트용
app.get("/", (req, res) => {
  res.send("🥔 OrcaX 감자 서버 정상 작동 중!");
});

app.listen(port, () => {
  console.log(`🚀 서버가 포트 ${port}에서 실행 중`);
});
