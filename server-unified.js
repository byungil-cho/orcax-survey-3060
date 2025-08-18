// server-unified.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import adminRoutes from "./routes/admin-routes.js";
app.use("/api/admin", adminRoutes);

// 라우터 불러오기
import cornRoutes from "./routes/corn-routes.js";
// 👉 필요하면 potato, barley 같은 라우터도 여기 추가
// import potatoRoutes from "./routes/potato-routes.js";
// import barleyRoutes from "./routes/barley-routes.js";

const app = express();
const PORT = 3060;

// ===== 미들웨어 설정 =====
app.use(cors());
app.use(express.json());

// ===== 라우터 연결 =====
app.use("/api/corn", cornRoutes);
// app.use("/api/potato", potatoRoutes);
// app.use("/api/barley", barleyRoutes);

// ===== MongoDB 연결 =====
const MONGO_URI = "mongodb://localhost:27017/farm";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1); // 연결 실패 시 프로세스 종료
  });

// ===== 서버 실행 =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

