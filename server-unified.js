// server-unified.js — 통합 서버(감자 먼저, 옥수수 위에)
// • MongoDB Native만 사용(외부 모델/라우터 없어도 가동)
// • CORS: 특정 오리진 + credentials 허용
// • 캐시 금지(304 방지)
// • 감자(users) 핵심 3엔드포인트: /api/login, /api/init-user, /api/userdata
//   - 로그인 전에는 /api/init-user가 200 + needLogin 반환(프론트 에러 방지)
//   - 응답 평탄화(legacy): kakaoId, water, fertilizer, tokens, gamja, bori 최상위 제공
//   - /api/gamja/* 별칭도 제공(구 클라이언트 호환)
// • 옥수수(corn) 모듈 자동 장착: /api/corn (있으면 붙고, 없으면 경고만)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const app = express();

/* ==== CORS: 특정 오리진만 허용 + credentials 허용 ==== */
const ALLOWED_ORIGINS = [
  "https://byungil-cho.github.io",
  /\.ngrok\.io$/, // 임의의 ngrok 도메인 허용
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // 서버 내부/로컬
      const ok = ALLOWED_ORIGINS.some((rule) =>
        rule instanceof RegExp ? rule.test(origin) : rule === origin
      );
      cb(ok ? null : new Error("CORS blocked"), ok);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

/* ==== 캐시 금지(304 방지) ==== */
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(bodyParser.json());

/* ==== 기본 설정 ==== */
const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DBNAME || "farmDB";
const PORT = process.env.PORT || 3060;

let client;
let db;

// 헬스 & 라우트 인벤토리
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/__routes", (_req, res) => {
  const list = [];
  const stack = app._router?.stack || [];
  for (const l of stack) {
    if (l.route) {
      list.push({
        method: Object.keys(l.route.methods)[0].toUpperCase(),
        path: l.route.path,
      });
    } else if (l.name === "router" && l.handle?.stack) {
      for (const s of l.handle.stack) {
        if (s.route) {
          list.push({
            method: Object.keys(s.route.methods)[0].toUpperCase(),
            path: s.route.path,
          });
        }
      }
    }
  }
  res.json(list);
});

/* ==== 유틸 ==== */
const asNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const usersCol = () => db.collection("users");
const cornCol = () => db.collection("corn_data");

// corn 문서 보장 + 필드 보정
async function ensureCornDocSafe(kakaoId) {
  let c = await cornCol().findOne({ kakaoId });
  if (!c) {
    c = {
      kakaoId,
      seed: 0,             // 단일 seed로 사용
      water: 0,
      fertilizer: 0,
      corn: 0,
      popcorn: 0,
      additives: { salt: 0, sugar: 0 },
      token: 0,
      loan: { active: false, unpaid: 0, startDate: null },
      bankrupt: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await cornCol().insertOne(c);
  } else {
    // 필드 누락시 보강
    c.seed       = asNum(c.seed, 0);
    c.corn       = asNum(c.corn, 0);
    c.popcorn    = asNum(c.popcorn, 0);
    c.additives  = c.additives || { salt: 0, sugar: 0 };
    c.additives.salt  = asNum(c.additives.salt, 0);
    c.additives.sugar = asNum(c.additives.sugar, 0);
    c.token      = asNum(c.token, 0);
  }
  return c;
}

// 감자 응답 평탄화(legacy 호환)
const flattenUser = (u) => ({
  success: true,
  user: u,
  kakaoId: u.kakaoId,
  nickname: u.nickname,
  water: asNum(u.water, 0),
  fertilizer: asNum(u.fertilizer, 0),
  tokens: asNum(u.tokens ?? u.orcx, 0),
  storage: u.storage || { gamja: 0, bori: 0 },
  gamja: asNum(u.storage?.gamja, 0),
  bori: asNum(u.storage?.bori, 0),
});

/* ==== 서버 시작 ==== */
(async () => {
  try {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ MongoDB connected: ${MONGO_URI}/${DB_NAME}`);

    /* ----------------------------------------------------------
       감자(users) — 핵심 3엔드포인트(라우터 없이도 작동)
       ---------------------------------------------------------- */

    // /api/login (POST): users 보장 + 평탄화 응답
    const loginHandler = async (req, res) => {
      try {
        const { kakaoId, nickname } = req.body || {};
        if (!kakaoId)
          return res.status(400).json({ success: false, message: "kakaoId 필요" });

        let u = await usersCol().findOne({ kakaoId });
        if (!u) {
          u = {
            kakaoId,
            nickname: nickname || "",
            water: 10,
            fertilizer: 10,
            tokens: 10, // (orcx와 동치)
            storage: { gamja: 0, bori: 0 },
            growth: {},
            products: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await usersCol().insertOne(u);
        }
        res.json(flattenUser(u));
      } catch (e) {
        console.error("[login] error:", e);
        res.status(500).json({ success: false });
      }
    };

    // /api/init-user (GET/POST): 로그인 전 200+needLogin, 로그인 후 users+corn 동시 보장
    const initHandler = async (req, res) => {
      try {
        const kakaoId  = req.body?.kakaoId || req.query?.kakaoId;
        const nickname = req.body?.nickname || req.query?.nickname || "";
        if (!kakaoId) {
          return res.json({
            success: false,
            needLogin: true,
            message: "로그인 필요",
            user: null,
            corn: null,
          });
        }

        let u = await usersCol().findOne({ kakaoId });
        if (!u) {
          u = {
            kakaoId,
            nickname,
            water: 10,
            fertilizer: 10,
            tokens: 10,
            storage: { gamja: 0, bori: 0 },
            growth: {},
            products: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await usersCol().insertOne(u);
        }
        const c = await ensureCornDocSafe(kakaoId);

        res.json({
          ...flattenUser(u),         // 감자 평탄화
          corn: c,                   // 옥수수 전체
          corn_tokens:  asNum(c.token, 0),
          corn_popcorn: asNum(c.popcorn, 0),
          corn_seeds:   asNum(c.seed, 0),
        });
      } catch (e) {
        console.error("[init-user] error:", e);
        res.status(500).json({ success: false });
      }
    };

    // /api/userdata (POST): upsert + 숫자 보정 + corn도 함께 내려줌
    const userdataHandler = async (req, res) => {
      try {
        const {
          kakaoId, nickname, water, fertilizer, tokens, gamja, bori,
        } = req.body || {};
        if (!kakaoId)
          return res.status(400).json({ success: false, message: "kakaoId 필요" });

        const set = { updatedAt: new Date() };
        if (nickname   !== undefined) set.nickname   = String(nickname || "");
        if (water      !== undefined) set.water      = asNum(water, 0);
        if (fertilizer !== undefined) set.fertilizer = asNum(fertilizer, 0);
        if (tokens     !== undefined) set.tokens     = asNum(tokens, 0);
        if (gamja !== undefined || bori !== undefined) {
          // 기존 storage와 병합
          const u0 = await usersCol().findOne({ kakaoId });
          const cur = u0?.storage || { gamja: 0, bori: 0 };
          set.storage = {
            gamja: asNum(gamja, cur.gamja),
            bori:  asNum(bori,  cur.bori ),
          };
        }

        const r = await usersCol().findOneAndUpdate(
          { kakaoId },
          { $set: set, $setOnInsert: {
              kakaoId,
              nickname: nickname || "",
              water: 10, fertilizer: 10, tokens: 10,
              storage: { gamja: 0, bori: 0 },
              growth: {}, products: {}, createdAt: new Date()
            }},
          { upsert: true, returnDocument: "after" }
        );
        const u = r.value;
        const c = await ensureCornDocSafe(kakaoId);

        // 감자/보리 프론트 호환 응답
        res.json({
          success: true,
          user: {
            nickname: u.nickname,
            inventory: {
              water:      asNum(u.water, 0),
              fertilizer: asNum(u.fertilizer, 0),
              seedPotato: 0,
              seedBarley: 0,
            },
            orcx:   asNum(u.tokens, 0),
            wallet: { orcx: asNum(u.tokens, 0) },
            potato: asNum(u.storage?.gamja, 0),
            barley: asNum(u.storage?.bori, 0),
            growth: u.growth || {},
            agri:      { corn: asNum(c.corn, 0), seedCorn: asNum(c.seed, 0) },
            additives: { salt: asNum(c.additives?.salt, 0), sugar: asNum(c.additives?.sugar, 0) },
            food:      { popcorn: asNum(c.popcorn, 0) }
          },
          // 평탄화(구형도 동시에 만족)
          kakaoId: u.kakaoId,
          nickname: u.nickname,
          water: asNum(u.water, 0),
          fertilizer: asNum(u.fertilizer, 0),
          tokens: asNum(u.tokens, 0),
          storage: u.storage || { gamja: 0, bori: 0 },
          gamja: asNum(u.storage?.gamja, 0),
          bori: asNum(u.storage?.bori, 0),
        });
      } catch (e) {
        console.error("[userdata] error:", e);
        res.status(500).json({ success: false });
      }
    };

    // 경로 장착(항상 제공 — 외부 라우터가 있어도 이게 먼저 처리)
    app.post("/api/login", loginHandler);
    app.get ("/api/init-user", initHandler);
    app.post("/api/init-user", initHandler);
    app.post("/api/userdata", userdataHandler);

    // 감자 별칭 경로(/api/gamja/*) — 구 클라 호환
    app.post("/api/gamja/login",     loginHandler);
    app.get ("/api/gamja/init-user", initHandler);
    app.post("/api/gamja/init-user", initHandler);
    app.post("/api/gamja/userdata",  userdataHandler);

    /* ----------------------------------------------------------
       옥수수 모듈 자동 장착 — 이미 있는 파일만 사용
       ---------------------------------------------------------- */
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
      console.warn("⚠️  corn 모듈을 찾지 못했습니다. (후보 경로 중 실제 경로 하나만 맞춰 주세요)");
    }

    /* ==== START ==== */
    app.listen(PORT, () => console.log(`🚀 Server running on : ${PORT}`));
  } catch (e) {
    console.error("❌ DB connect failed:", e.message);
    process.exit(1);
  }
})();

/* ==== 모듈 로더 유틸 ==== */
function tryMount(mountPath, rel) {
  try {
    const full = path.join(__dirname, rel);
    const exists =
      fs.existsSync(full) ||
      fs.existsSync(`${full}.js`) ||
      fs.existsSync(path.join(full, "index.js"));
    if (!exists) { console.warn(`⚠️  skip: ${rel} (없음)`); return false; }

    const mod = require(full);
    if (mod && typeof mod.use === "function") {
      app.use(mountPath, mod);
      console.log(`✅ mounted(router): ${mountPath} <- ${rel}`);
      return true;
    }
    if (typeof mod === "function") {
      if (mod.length >= 2) {
        mod(app, app.locals.db);                // (app, db)
        console.log(`✅ mounted(fn app,db): ${mountPath} <- ${rel}`);
        return true;
      }
      if (mod.length === 1) {
        const r = mod(app.locals.db);           // (db) -> router
        if (r && typeof r.use === "function") {
          app.use(mountPath, r);
          console.log(`✅ mounted(fn db->router): ${mountPath} <- ${rel}`);
          return true;
        }
      }
      if (mod.length === 0) {
        const r = mod();                        // () -> router
        if (r && typeof r.use === "function") {
          app.use(mountPath, r);
          console.log(`✅ mounted(fn ->router): ${mountPath} <- ${rel}`);
          return true;
        }
      }
    }
    console.warn(`⚠️  unsupported export: ${rel}`);
    return false;
  } catch (e) {
    console.error(`❌ mount 실패: ${rel} -> ${e.message}`);
    return false;
  }
}

/* ==== 안전망 ==== */
process.on("unhandledRejection", (e) => console.error("UNHANDLED:", e));
process.on("uncaughtException",  (e) => console.error("UNCAUGHT :", e));
process.on("SIGINT", async () => { try { await client?.close(); } catch {} process.exit(0); });






