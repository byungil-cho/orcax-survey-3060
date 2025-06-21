// server.js

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = 3060; // ngrok이 연결될 포트

// ✅ MongoDB 연결
const uri = process.env.MONGODB_URL;
if (!uri) {
  console.error("❌ MONGODB_URL 환경변수가 없습니다.");
  process.exit(1);
}

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 완료"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });

const harvestRoutes = require('./routes/harvest');
app.use(harvestRoutes);

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json());

// ✅ 라우터 연결 (api 폴더 기준)
const authRoutes = require("./api/auth");
const userRoutes = require("./api/user");
const farmRoutes = require("./api/farm");
const tokenRoutes = require("./api/token");
const exchangeRoutes = require("./api/exchange");
const processingRoutes = require("./api/processing");
const marketRoutes = require("./api/market");
const withdrawRoutes = require("./api/withdraw");
const adminRoutes = require("./api/admin");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/farm", farmRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/processing", processingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin", adminRoutes);

// ✅ 서버 상태 확인용 루트 엔드포인트
app.get("/", (req, res) => {
  res.send("✅ OrcaX 서버 정상 작동 중! 🐳");
});
