const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || "your-mongodb-uri", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공"))
.catch(err => console.error("❌ MongoDB 연결 실패:", err));

// 기본 상태 확인 라우터
app.get("/", (req, res) => {
  res.send("✅ 서버 정상 작동 중");
});

// 서버 정상 작동 확인용
app.get("/", (req, res) => {
  res.status(200).send("OrcaX 감자 서버가 작동 중입니다!");
});

// 모델 import
const User = require("./models/User");

// 예시: 유저 데이터 불러오기
app.get("/api/userdata", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});

