require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

const PORT = 3060;
const MONGODB_URL = process.env.MONGODB_URL;

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB 연결
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공"))
.catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ API 경로 라우팅
app.use("/api/login", require("./routes/login"));           // 로그인 처리
app.use("/api/init-user", require("./routes/init-user"));   // 초기 자산 지급
app.use("/api/userdata", require("./routes/userdata"));     // 사용자 정보
// 앞으로 추가될 routes도 여기에 연결만 하면 됩니다

// ✅ 루트 테스트용
app.get("/", (req, res) => {
  res.send("🌱 OrcaX 서버 정상 작동 중 (server-unified-fixed.js)");
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
