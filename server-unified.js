import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

import potatoRouter from "./routes/potato.js";
import barleyRouter from "./routes/barley.js";

// ✅ Corn Engine 전용 라우터 불러오기
import cornRouter from "./routes/corn-routes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== DB 연결 =====
mongoose.connect("mongodb://127.0.0.1:27017/farm", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===== 기존 라우터 =====
app.use("/api/potato", potatoRouter);
app.use("/api/barley", barleyRouter);

// 🚨 기존 옥수수 라우터 (간단 버전) 주석 처리 or 제거
// app.post("/api/corn/plant", ...)
// app.post("/api/corn/harvest", ...)
// app.post("/api/corn/pop", ...)
// app.post("/api/corn/exchange", ...)

// ===== Corn Engine 5.0 라우터 연결 =====
app.use("/api/corn", cornRouter);

// ===== 서버 시작 =====
const PORT = 3060;  // ✅ 감자/보리/옥수수 통합 서버
app.listen(PORT, () => {
  console.log(`🚀 Farm 서버 실행 중: http://localhost:${PORT}`);
});

