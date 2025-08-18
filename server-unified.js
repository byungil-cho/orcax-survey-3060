// server-unified.js
// 통합 서버 (Potato/Barley + CornEngine 5.0)

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

import potatoRouter from "./routes/potato.js";
import barleyRouter from "./routes/barley.js";

// 🚨 Corn Engine 5.0 라우터
import cornRouter from "./routes/corn-routes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== DB 연결 =====
mongoose.connect("mongodb://127.0.0.1:27017/farm", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===== 라우터 연결 =====
app.use("/api/potato", potatoRouter);
app.use("/api/barley", barleyRouter);

// 🚨 기존 Corn API (간단 버전) 비활성화
// app.post("/api/corn/plant", ...)
// app.post("/api/corn/harvest", ...)
// app.post("/api/corn/pop", ...)
// app.post("/api/corn/exchange", ...)
// ❌ 전부 제거 또는 주석 처리해야 함.

// ===== Corn Engine 5.0 라우터 연결 =====
app.use("/api/corn", cornRouter);

// ===== 서버 시작 =====
const PORT = 6060;  // ✅ 포트 6060 고정
app.listen(PORT, () => {
  console.log(`🚀 Farm 서버 실행 중: http://localhost:${PORT}`);
});

