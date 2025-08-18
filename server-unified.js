import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

// ✅ 라우터 import
// (감자/보리 라우터는 파일이 준비 안되어 있으면 주석 처리 가능)
import cornRouter from "./routes/corn-routes.js";
// import potatoRouter from "./routes/potato.js";
// import barleyRouter from "./routes/barley.js";

const app = express();
const PORT = 3060; // ✅ 주인님이 말씀하신 포트

// ===== 미들웨어 =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== MongoDB 연결 =====
// 실제 주소는 주인님 환경에 맞게 수정하세요.
mongoose
  .connect("mongodb://localhost:27017/farmgame", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ===== 라우터 등록 =====
// app.use("/api/potato", potatoRouter);
// app.use("/api/barley", barleyRouter);
app.use("/api/corn", cornRouter);

// ===== 기본 라우트 =====
app.get("/", (req, res) => {
  res.send("🌽 FarmGame 서버 실행 중 (Potato/Barley/Corn)");
});

// ===== 서버 실행 =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

