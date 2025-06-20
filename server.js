// 📂 server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// ✅ 포트 고정 (쿡 ngrok과 일치)
const PORT = 3060;

// ✅ MongoDB 연결 (주인님 환경에 맞게 URI 교체)
mongoose
  .connect("mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 완료"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json());

// ✅ 라우터 연결
const userRoutes = require("./routes/userdata");
app.use("/api/userdata", userRoutes);

// ✅ 기본 루트 확인용 응답
app.get("/", (req, res) => {
  res.send("✅ OrcaX 서버 정상 작동 중! 🐳");
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 OrcaX 서버 시작됨! 포트: ${PORT}`);
});

