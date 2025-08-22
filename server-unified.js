// server-unified.js — potato(감자) 건드리지 않고 corn(옥수수)만 연결
// [원칙] 새 파일 생성 없음. 이미 올려둔 모듈만 찾아 붙임.

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== 기본 설정 =====
const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME   = process.env.MONGODB_DBNAME || "farmDB";
const PORT      = process.env.PORT || 3060;

let client, db;

// 헬스 & 라우트 인벤토리(실제로 올라간 엔드포인트 확인용)
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/__routes", (_req, res) => {
  const list = [];
  const stack = app._router?.stack || [];
  for (const l of stack) {
    if (l.route) {
      list.push({ method: Object.keys(l.route.methods)[0].toUpperCase(), path: l.route.path });
    } else if (l.name === "router" && l.handle?.stack) {
      const base = l.regexp?.toString?.() || "";
      for (const s of l.handle.stack) {
        if (s.route) {
          list.push({
            base,
            method: Object.keys(s.route.methods)[0].toUpperCase(),
            path: s.route.path,
          });
        }
      }
    }
  }
  res.json(list);
});

// ===== Mongo 연결 & 부팅 =====
(async () => {
  try {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db(DB_NAME);
    app.locals.db = db; // 일부 기존 모듈이 req.app.locals.db 이용 가능
    console.log(`✅ MongoDB connected: ${MONGO_URI}/${DB_NAME}`);

    // ------------------------------------------------------------
    // 1) 감자(users) 라우트 — 절대 수정하지 않음. 있으면 그대로 장착, 없으면 스킵.
    //    (기존 동작 유지용. 새 파일 생성 X)
    safeMount("/api/login",    "./routes/login");    // POST /api/login
    safeMount("/api/userdata", "./routes/userdata"); // POST /api/userdata

    // ------------------------------------------------------------
    // 2) 옥수수 전용 카카오 로그인 브리지 (감자 라우트는 그대로 둔 채, 경로만 분리)
    //    -> corn-farm.html에서 /api/corn/login 호출해도 감자 users 컬렉션을 그대로 사용
    const usersCol = () => db.collection("users");
    app.post("/api/corn/login", async (req, res) => {
      try {
        const { kakaoId, nickname } = req.body || {};
        if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

        let user = await usersCol().findOne({ kakaoId });
        if (!user) {
          user = {
            kakaoId,
            nickname: nickname || "",
            water: 10,
            fertilizer: 10,
            tokens: 10,
            storage: { gamja: 0, bori: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await usersCol().insertOne(user);
        }
        res.json({ success: true, user });
      } catch (e) {
        console.error("/api/corn/login error:", e);
        res.status(500).json({ success: false, message: "server error" });
      }
    });

    // ------------------------------------------------------------
    // 3) 옥수수 전용 init 브리지 (corn_data 기본 문서 보장)
    const cornCol = () => db.collection("corn_data");
    const ensureCorn = async (kakaoId) => {
      let corn = await cornCol().findOne({ kakaoId });
      if (!corn) {
        corn = {
          kakaoId, seeds: 0, water: 0, fertilizer: 0, corn: 0, popcorn: 0, salt: 0, sugar: 0, token: 0,
          loan: { active: false, unpaid: 0, startDate: null }, bankrupt: false,
          createdAt: new Date(), updatedAt: new Date(),
        };
        await cornCol().insertOne(corn);
      }
      return corn;
    };
    app.get("/api/corn/init-user", async (req, res) => {
      try {
        const kakaoId = req.query?.kakaoId;
        const nickname = req.query?.nickname || "";
        if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

        let user = await usersCol().findOne({ kakaoId });
        if (!user) {
          user = {
            kakaoId, nickname, water: 10, fertilizer: 10, tokens: 10,
            storage: { gamja: 0, bori: 0 }, createdAt: new Date(), updatedAt: new Date(),
          };
          await usersCol().insertOne(user);
        }
        const corn = await ensureCorn(kakaoId);
        res.json({ success: true, user, corn });
      } catch (e) {
        console.error("/api/corn/init-user(GET) error:", e);
        res.status(500).json({ success: false, message: "server error" });
      }
    });
    app.post("/api/corn/init-user", async (req, res) => {
      try {
        const kakaoId = req.body?.kakaoId;
        const nickname = req.body?.nickname || "";
        if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

        let user = await usersCol().findOne({ kakaoId });
        if (!user) {
          user = {
            kakaoId, nickname, water: 10, fertilizer: 10, tokens: 10,
            storage: { gamja: 0, bori: 0 }, createdAt: new Date(), updatedAt: new Date(),
          };
          await usersCol().insertOne(user);
        }
        const corn = await ensureCorn(kakaoId);
        res.json({ success: true, user, corn });
      } catch (e) {
        console.error("/api/corn/init-user(POST) error:", e);
        res.status(500).json({ success: false, message: "server error" });
      }
    });

    // ------------------------------------------------------------
    // 4) 이미 올려둔 "옥수수 모듈" 자동 로드 (router / (app,db) / (db)=>router / ()=>router 모두 지원)
    //    -> 존재하는 첫 번째 경로만 마운트 (중복 방지)
    const cornCandidates = [
      "./routes/cornRoutes",
      "./routes/corn/index",
      "./engines/corn",
      "./api/corn",
      "./corn/index",
      "./cornRoutes",
    ];
    let cornMounted = false;
    for (const rel of cornCandidates) {
      if (tryMount("/api/corn", rel)) { cornMounted = true; break; }
    }
    if (!cornMounted) {
      console.warn("⚠️  corn 모듈을 찾지 못했습니다. (위 후보 중 실제 경로로 하나만 맞춰 주세요)");
    }

    // ------------------------------------------------------------
    // START SERVER
    app.listen(PORT, () => console.log(`🚀 Server running on : ${PORT}`));
  } catch (e) {
    console.error("❌ DB connect failed:", e.message);
    process.exit(1);
  }
})();

// ===== 유틸: 기존 라우터 안전 장착 (있으면 붙이고, 없으면 경고만) =====
function safeMount(mountPath, rel) {
  const full = path.join(__dirname, rel);
  const found =
    fs.existsSync(full) ||
    fs.existsSync(`${full}.js`) ||
    fs.existsSync(path.join(full, "index.js"));
  if (!found) {
    console.warn(`⚠️  route skipped (not found): ${mountPath} <- ${rel}`);
    return false;
  }
  try {
    const mod = require(full);
    if (mod && typeof mod.use === "function") {
      app.use(mountPath, mod);
      console.log(`✅ route mounted(router): ${mountPath} <- ${rel}`);
      return true;
    }
    if (typeof mod === "function") {
      // (db) => router  또는  (app, db)  또는  ()=>router
      if (mod.length >= 2) {
        mod(app, db);
        console.log(`✅ route mounted(fn app,db): ${mountPath} <- ${rel}`);
        return true;
      } else if (mod.length === 1) {
        const r = mod(db);
        if (r && typeof r.use === "function") {
          app.use(mountPath, r);
          console.log(`✅ route mounted(fn db->router): ${mountPath} <- ${rel}`);
          return true;
        }
      } else {
        const r = mod();
        if (r && typeof r.use === "function") {
          app.use(mountPath, r);
          console.log(`✅ route mounted(fn ->router): ${mountPath} <- ${rel}`);
          return true;
        }
      }
    }
    console.warn(`⚠️  route export unsupported: ${mountPath} <- ${rel}`);
    return false;
  } catch (e) {
    console.error(`❌ route mount failed: ${mountPath} <- ${rel} :: ${e.message}`);
    return false;
  }
}

// ===== 유틸: corn 모듈 마운트 (이미 올린 파일만 사용) =====
function tryMount(mountPath, rel) {
  const full = path.join(__dirname, rel);
  const exists =
    fs.existsSync(full) ||
    fs.existsSync(`${full}.js`) ||
    fs.existsSync(path.join(full, "index.js"));
  if (!exists) {
    console.warn(`⚠️  skip: ${rel} (없음)`);
    return false;
  }
  try {
    const mod = require(full);

    // express.Router export
    if (mod && typeof mod.use === "function") {
      app.use(mountPath, mod);
      console.log(`✅ mounted(router): ${mountPath} <- ${rel}`);
      return true;
    }
    // function (app, db)
    if (typeof mod === "function" && mod.length >= 2) {
      mod(app, db);
      console.log(`✅ mounted(fn app,db): ${mountPath} <- ${rel}`);
      return true;
    }
    // function (db) -> router
    if (typeof mod === "function" && mod.length === 1) {
      const r = mod(db);
      if (r && typeof r.use === "function") {
        app.use(mountPath, r);
        console.log(`✅ mounted(fn db->router): ${mountPath} <- ${rel}`);
        return true;
      }
    }
    // function () -> router
    if (typeof mod === "function" && mod.length === 0) {
      const r = mod();
      if (r && typeof r.use === "function") {
        app.use(mountPath, r);
        console.log(`✅ mounted(fn ->router): ${mountPath} <- ${rel}`);
        return true;
      }
    }
    console.warn(`⚠️  unsupported export: ${rel}`);
    return false;
  } catch (e) {
    console.error(`❌ mount 실패: ${rel} -> ${e.message}`);
    return false;
  }
}

// ===== 안전망 =====
process.on("unhandledRejection", (e) => console.error("UNHANDLED:", e));
process.on("uncaughtException",  (e) => console.error("UNCAUGHT :", e));
process.on("SIGINT", async () => { try { await client?.close(); } catch {} process.exit(0); });
