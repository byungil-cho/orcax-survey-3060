require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// API 라우터 경로 설정
app.use("/api/user", require("./routes/userdata")); // 기존 사용자 정보
app.use("/api/user/v2data", require("./routes/userdata_v2")); // 사용자 정보 V2

app.use("/api/seed/status", require("./routes/seed-status")); // 씨앗 상태
app.use("/api/seed/price", require("./routes/seed-price")); // 씨앗 가격
app.use("/api/seed/buy", require("./routes/seed-buy")); // 씨앗 구매

// 테스트용 메인
app.get("/", (req, res) => {
  res.send("🌱 OrcaX 서버가 정상 작동 중입니다.");
});

// 포트 설정
const PORT = 3060;
app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버가 포트 ${PORT}에서 실행 중`);
});
