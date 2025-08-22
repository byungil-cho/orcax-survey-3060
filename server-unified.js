// server-unified.js — 감자 라우트는 그대로, 옥수수는 엔진 모듈(없으면 스킵)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ 환경변수 우선 (주인님 고정키: MONGODB_URL)
const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME   = process.env.MONGODB_DBNAME || "farmDB";

let client, db;

// 헬스체크
app.get("/health", (_req, res) => res.json({ ok: true }));

/** 안전하게 라우터 장착 (존재하면 붙이고, 없으면 경고만) — 감자/보리용 */
function safeUse(mountPath, relModulePath) {
  try {
    const full = path.join(__dirname, relModulePath);
    const router = require(full);
    app.use(mountPath, router);
    console.log(`✅ route mounted: ${mountPath} -> ${relModulePath}`);
  } catch (e) {
    console.warn(`⚠️  route skipped (not found): ${mountPath} -> ${relModulePath}`);
  }
}

(async () => {
  try {
    // DB 연결
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db(DB_NAME);
    app.locals.db = db;
    console.log("✅ MongoDB 연결 성공");

    /* =========================
       감자/보리 라우터 — 기존 그대로 유지
       (파일이 있으면 장착, 없으면 경고만)
       ========================= */
    safeUse("/api/factory",      "./routes/factoryRoutes");
    safeUse("/api/auth",         "./routes/authRoutes");
    safeUse("/api/user",         "./routes/userRoutes");
    safeUse("/api/userdataV2",   "./routes/userdataV2Routes");
    safeUse("/api/seed",         "./routes/seedRoutes");
    safeUse("/api/seedbuy",      "./routes/seedBuyRoutes");
    safeUse("/api/inituser",     "./routes/initUserRoutes");   // 하이픈 없는 구버전도 보존
    safeUse("/api/loginRoutes",  "./routes/loginRoutes");
    safeUse("/api/processing",   "./routes/processingRoutes");
    safeUse("/api/marketdata",   "./routes/marketdataRoutes");
    safeUse("/api/market",       "./routes/marketRoutes");
    safeUse("/api/seedPrice",    "./routes/seedPriceRoutes");

    /* =========================
       옥수수 엔진 모듈 — 모듈만 장착 (내장 라우터 없음)
       - ./engines/corn/index.js 가 있으면 app, db 주입해서 /api/corn 붙임
       - 없으면 건너뜀 (감자 서버는 계속 정상동작)
       ========================= */
    try {
      const cornEngine = require(path.join(__dirname, "./engines/corn"));
      if (typeof cornEngine === "function") {
        cornEngine(app, db); // 내부에서 /api/corn mount
        console.log("🌽 corn router attached at /api/corn (engine module)");
      } else {
        console.warn("⚠️  ./engines/corn 가 함수 모듈이 아닙니다. 스킵합니다.");
      }
    } catch (e) {
      console.warn("🌽 corn engine module not found. (옥수수 미장착, 감자는 정상)");
    }

    /* =========================
       서버 시작
       ========================= */
    const PORT = process.env.PORT || 3060;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 MongoDB: ${MONGO_URI}/${DB_NAME}`);
    });
  } catch (err) {
    console.error("❌ DB 연결 실패:", err.message);
    process.exit(1);
  }
})();

// 안전망
process.on("unhandledRejection", (e) => console.error("UNHANDLED:", e));
process.on("uncaughtException",  (e) => console.error("UNCAUGHT :", e));
process.on("SIGINT", async () => { try { await client?.close(); } catch {} process.exit(0); });






