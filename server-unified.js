// ====== 기본 모듈 ======
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// ====== 라우터 ======
import adminRoutes from "./routes/admin-routes.js";
import cornRoutes from "./routes/corn-routes.js";
// 필요한 경우 추가
// import potatoRoutes from "./routes/potato-routes.js";
// import barleyRoutes from "./routes/barley-routes.js";

// ====== 엔진 모듈 ======
import cornEngine from "./engtes/engine.js";
import harvest from "./engtes/harvest.js";
import reward from "./engtes/reward.js";
import growth from "./engtes/growth.js";
import level from "./engtes/level.js";
import status from "./engtes/status.js";
import popcorn from "./engtes/popcorn.js";
import resources from "./engtes/resources.js";
import gauge from "./engtes/gauge.js";
import adminEngine from "./engtes/admin.js";

// ====== 앱 설정 ======
const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ====== 정적 HTML 파일 서빙 ======
app.use(express.static("public"));

// ====== 라우터 연결 ======
app.use("/api/admin", adminRoutes);
app.use("/api/corn", cornRoutes);
// app.use("/api/potato", potatoRoutes);
// app.use("/api/barley", barleyRoutes);

// ====== MongoDB 연결 ======
const MONGO_URI = "mongodb://localhost:27017/farm";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });

// ====== 엔진 초기화 ======
try {
  cornEngine.init?.();
  harvest.init?.();
  reward.init?.();
  growth.init?.();
  level.init?.();
  status.init?.();
  popcorn.init?.();
  resources.init?.();
  gauge.init?.();
  adminEngine.init?.();
  console.log("✅ 엔진 모듈 초기화 완료");
} catch (err) {
  console.error("⚠️ 엔진 초기화 중 오류:", err);
}

// ====== 서버 실행 ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
