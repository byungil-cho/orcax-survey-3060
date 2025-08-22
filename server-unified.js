// server-unified.js — 통합 서버 (감자 죽이지 않고 옥수수도 살림)
// 새 파일 만들지 않음. 이미 올려둔 라우트/모듈만 찾아 붙임.

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const app = express();

/* ===== CORS: 특정 오리진만 허용 + credentials 허용 ===== */
const ALLOWED_ORIGINS = [
  "https://byungil-cho.github.io",
  /\.ngrok\.io$/ // 임의의 ngrok 도메인
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // 서버 내부/로컬 호출
    const ok = ALLOWED_ORIGINS.some(rule =>
      (rule instanceof RegExp) ? rule.test(origin) : rule === origin
    );
    cb(ok ? null : new Error("CORS blocked"), ok);
  },
  credentials: true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
}));

app.use(bodyParser.json());

/* ===== 기본 설정 ===== */
const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME   = process.env.MONGODB_DBNAME || "farmDB";
const PORT      = process.env.PORT || 3060;

let client, db;

/* ===== 헬스 & 라우트 인벤토리 ===== */
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
          list.push({ base, method: Object.keys(s.route.methods)[0].toUpperCase(), path: s.route.path });
        }
      }
    }
  }
  res.json(list);
});

/* ===== Mongo 연결 & 부팅 ===== */
(async () => {
  try {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db(DB_NAME);
    app.locals.db = db;
    console.log(`✅ MongoDB connected: ${MONGO_URI}/${DB_NAME}`);

    /* ----------------------------------------------------------------
       1) 감자(users) 기존 라우트가 있으면 그대로 장착, 없으면 스킵
       ---------------------------------------------------------------- */
    safeMount("/api/login",    "./routes/login");    // POST /api/login
    safeMount("/api/userdata", "./routes/userdata"); // POST /api/userdata

    /* ----------------------------------------------------------------
       2) 호환(shim) 엔드포인트 — 프론트가 지금 부르는 경로를 404 없이 살림
          (기존 라우트 파일이 있으면 그것이 우선. 없을 때만 이게 동작)
       ---------------------------------------------------------------- */
    const usersCol = () => db.collection("users");
    const cornCol  = () => db.collection("corn_data");

    // /api/login (POST)
    app.post("/api/login", async (req, res, next) => {
      // 기존 라우트가 이미 붙어 있으면 다음 미들웨어로 패스
      if (routeExists("/api/login", "post")) return next();
      try {
        const { kakaoId, nickname } = req.body || {};
        if (!kakaoId) return res.status(400).json({ success:false, message:"kakaoId 필요" });

        let u = await usersCol().findOne({ kakaoId });
        if (!u) {
          u = {
            kakaoId, nickname: nickname||"", water:10, fertilizer:10, tokens:10,
            storage:{ gamja:0, bori:0 }, createdAt:new Date(), updatedAt:new Date()
          };
          await usersCol().insertOne(u);
        }
        res.json({ success:true, user:u });
      } catch (e) {
        console.error("/api/login shim error:", e);
        res.status(500).json({ success:false });
      }
    });

    // /api/init-user (GET/POST): users + corn_data 동시 보장
    async function ensureAll(kakaoId, nickname="") {
      let u = await usersCol().findOne({ kakaoId });
      if (!u) {
        u = {
          kakaoId, nickname, water:10, fertilizer:10, tokens:10,
          storage:{ gamja:0, bori:0 }, createdAt:new Date(), updatedAt:new Date()
        };
        await usersCol().insertOne(u);
      }
      let c = await cornCol().findOne({ kakaoId });
      if (!c) {
        c = {
          kakaoId, seeds:0, water:0, fertilizer:0, corn:0, popcorn:0, salt:0, sugar:0, token:0,
          loan:{ active:false, unpaid:0, startDate:null }, bankrupt:false,
          createdAt:new Date(), updatedAt:new Date()
        };
        await cornCol().insertOne(c);
      }
      return { user:u, corn:c };
    }
    const initHandler = async (req, res) => {
      // 기존 라우트가 있으면 그 라우트가 먼저 처리됨(여긴 도달 안함)
      try {
        const kakaoId  = req.body?.kakaoId || req.query?.kakaoId;
        const nickname = req.body?.nickname || req.query?.nickname || "";
        if (!kakaoId) return res.status(400).json({ success:false, message:"kakaoId 필요" });
        const data = await ensureAll(kakaoId, nickname);
        res.json({ success:true, ...data });
      } catch (e) {
        console.error("/api/init-user shim error:", e);
        res.status(500).json({ success:false });
      }
    };
    app.get ("/api/init-user", initHandler);
    app.post("/api/init-user", initHandler);

    // /api/userdata (POST)
    app.post("/api/userdata", async (req, res, next) => {
      if (routeExists("/api/userdata", "post")) return next();
      try {
        const { kakaoId, nickname, water, fertilizer, tokens, gamja, bori } = req.body || {};
        if (!kakaoId) return res.status(400).json({ success:false, message:"kakaoId 필요" });

        const set = { updatedAt:new Date() };
        if (nickname   !== undefined) set.nickname   = nickname;
        if (water      !== undefined) set.water      = Number(water);
        if (fertilizer !== undefined) set.fertilizer = Number(fertilizer);
        if (tokens     !== undefined) set.tokens     = Number(tokens);
        if (gamja !== undefined || bori !== undefined)
          set.storage = { gamja:Number(gamja||0), bori:Number(bori||0) };

        const r = await usersCol().findOneAndUpdate(
          { kakaoId },
          { $set:set, $setOnInsert:{ createdAt:new Date() } },
          { upsert:true, returnDocument:"after" }
        );
        res.json({ success:true, user:r.value });
      } catch (e) {
        console.error("/api/userdata shim error:", e);
        res.status(500).json({ success:false });
      }
    });

    /* ----------------------------------------------------------------
       3) 옥수수 모듈 자동 로더 — 이미 올린 파일을 그대로 /api/corn에 붙임
       ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
       START
       ---------------------------------------------------------------- */
    app.listen(PORT, () => console.log(`🚀 Server running on : ${PORT}`));
  } catch (e) {
    console.error("❌ DB connect failed:", e.message);
    process.exit(1);
  }
})();

/* ===== 유틸: 기존 라우터 안전 장착 (있으면 붙이고, 없으면 경고만) ===== */
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
      if (mod.length >= 2) {               // (app, db)
        mod(app, app.locals.db);
        console.log(`✅ route mounted(fn app,db): ${mountPath} <- ${rel}`);
        return true;
      } else if (mod.length === 1) {       // (db) => router
        const r = mod(app.locals.db);
        if (r && typeof r.use === "function") {
          app.use(mountPath, r);
          console.log(`✅ route mounted(fn db->router): ${mountPath} <- ${rel}`);
          return true;
        }
      } else {                             // () => router
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

/* ===== 유틸: corn 모듈 마운트 (이미 올린 파일만 사용) ===== */
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
      mod(app, app.locals.db);
      console.log(`✅ mounted(fn app,db): ${mountPath} <- ${rel}`);
      return true;
    }
    // function (db) -> router
    if (typeof mod === "function" && mod.length === 1) {
      const r = mod(app.locals.db);
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

/* ===== 유틸: 특정 경로 라우트 존재 체크 ===== */
function routeExists(pathname, method = "get") {
  const m = method.toLowerCase();
  const stack = app._router?.stack || [];
  for (const l of stack) {
    if (l.route && l.route.path === pathname && l.route.methods[m]) return true;
  }
  return false;
}

/* ===== 안전망 ===== */
process.on("unhandledRejection", (e) => console.error("UNHANDLED:", e));
process.on("uncaughtException",  (e) => console.error("UNCAUGHT :", e));
process.on("SIGINT", async () => { try { await client?.close(); } catch {} process.exit(0); });
