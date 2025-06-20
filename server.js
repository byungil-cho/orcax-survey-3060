const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3060; // ngrok과 연결할 포트

// ✅ MongoDB 연결 (URI는 .env에서 가져옴)
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI 환경변수 설정이 필요합니다.");
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

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json());

// ✅ API 라우터 연결
const userRoutes = require("./routes/userdata");
app.use("/api/userdata", userRoutes);
app.use("/api/user", userRoutes);  // ✅ 클라이언트 요청 대응용

// ✅ 기본 루트 응답 — ngrok 정상 확인용
app.get("/", (req, res) => {
  res.send("✅ OrcaX 서버 정상 작동 중! 🐳");
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버 시작됨! 포트: ${PORT}`);
});
