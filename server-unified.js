/* server-unified.js — CORN ONLY CLEANUP (seed only)
   - 감자/보리 로직은 손대지 않음
   - 옥수수는 DB/코드/응답 모두 'seed'(단수)로 통일
   - 클라이언트가 'seeds'로 보내도 미들웨어에서 'seed'로 강제 매핑
*/
'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));
app.use(morgan('dev'));

// ====== Mongo 연결 ======
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/farm';
mongoose.set('strictQuery', true);
mongoose.connection.on('error', (e) => console.error('[mongo] error:', e.message));
mongoose.connection.once('open', () => console.log('[mongo] connected'));
if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined }).catch(() => {});
}

/* =========================================================
   기존 감자/보리/유저 모델: 이미 어딘가에서 정의돼 있을 가능성 높음
   없으면 최소 스키마로 안전하게 정의 (있으면 재사용)
========================================================= */
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  kakaoId:   { type: String, index: true, unique: true },
  nickname:  { type: String, default: '' },
  orcx:      { type: Number, default: 0 },
  inventory: {
    water:     { type: Number, default: 0 },
    fertilizer:{ type: Number, default: 0 }
  }
}, { collection: 'users', timestamps: true }));

/* =========================================================
   CORN SETTINGS (가격판)
   - 주 키: seed, salt, sugar
   - 과거 문서에 seeds 키가 있어도 읽어서 seed로 사용
========================================================= */
const CornSettings = mongoose.models.CornSettings || mongoose.model('CornSettings', new mongoose.Schema({
  seed:  { type: Number, default: 100 },
  salt:  { type: Number, default: 10 },
  sugar: { type: Number, default: 20 }
}, { collection: 'corn_settings', timestamps: true }));

/* =========================================================
   CORN DATA (옥수수 전용)
   !!! seed(단수)만 사용 !!!
========================================================= */
const CornData = mongoose.models.CornData || mongoose.model('CornData', new mongoose.Schema({
  kakaoId:   { type: String, index: true, unique: true },
  nickname:  { type: String, default: '' },
  seed:      { type: Number, default: 0 },   // ← 단수로 통일
  corn:      { type: Number, default: 0 },
  popcorn:   { type: Number, default: 0 },
  additives: {
    salt:  { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  },
  phase:     { type: String, default: 'IDLE' }, // IDLE | GROW | STUBBLE
  g:         { type: Number, default: 0 },      // 성장 %
  plantedAt: { type: Date }
}, { collection: 'corn_data', timestamps: true }));

/* =========================================================
   유틸 (옥수수 전용)
========================================================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toKST = (d) => {
  const t = d ? new Date(d) : new Date();
  const tz = t.getTime() + (9 * 60 * 60 * 1000);
  return new Date(tz);
};
const dayNumber = (plantedAt) => {
  if (!plantedAt) return 0;
  const n = toKST(Date.now()); n.setHours(0,0,0,0);
  const p = toKST(plantedAt);  p.setHours(0,0,0,0);
  const diff = Math.floor((n - p) / (24*60*60*1000)) + 1;
  return Math.max(1, diff);
};
const gradeByDays = (plantedAt) => {
  const d = dayNumber(plantedAt);
  if (d < 5) return null;
  if (d < 6) return 'A';
  if (d < 7) return 'B';
  if (d < 8) return 'C';
  if (d < 9) return 'D';
  if (d < 10) return 'E';
  return 'F';
};

async function ensureCornDoc(kakaoId, nickname = '') {
  if (!kakaoId) throw new Error('kakaoId required');
  let corn = await CornData.findOne({ kakaoId });
  if (!corn) {
    corn = await CornData.create({
      kakaoId, nickname,
      seed: 0, corn: 0, popcorn: 0,
      additives: { salt: 0, sugar: 0 },
      phase: 'IDLE', g: 0
    });
  }
  return corn;
}

/* =========================================================
   미들웨어: CORN ONLY — 들어오는 'seeds'를 'seed'로 강제
========================================================= */
app.use('/api/corn/buy-additive', (req, _res, next) => {
  if (req.method === 'POST' && req.body) {
    if (req.body.item === 'seeds') req.body.item = 'seed';
    if (req.body.type === 'seeds') req.body.type = 'seed';
  }
  next();
});

/* =========================================================
   가격판
========================================================= */
app.get('/api/corn/priceboard', async (_req, res) => {
  try {
    const doc = await CornSettings.findOne({}).lean();
    if (!doc) return res.json({ price: { seed: 100, salt: 10, sugar: 20 } });
    // 혹시 옛 문서에 seeds 키가 있으면 seed로 매핑
    const price = {
      seed:  Number(doc.seed ?? doc.seeds ?? 100),
      salt:  Number(doc.salt ?? 10),
      sugar: Number(doc.sugar ?? 20)
    };
    return res.json({ price });
  } catch (e) {
    console.error('priceboard error', e);
    return res.status(500).json({ error: '가격 조회 실패' });
  }
});

/* =========================================================
   구매: buy-additive (seed/salt/sugar)
   - 토큰 차감 → 인벤토리 증가 → 저장 → seed/ seeds 둘 다 응답에 실어 호환
========================================================= */
app.post('/api/corn/buy-additive', async (req, res) => {
  try {
    const { kakaoId, item, qty, amount } = req.body || {};
    const q = Math.max(1, Number(qty ?? amount ?? 1));
    const it = String(item || '').toLowerCase(); // 'seed' | 'salt' | 'sugar'
    if (!kakaoId || !['seed','salt','sugar'].includes(it)) {
      return res.status(400).json({ error: 'kakaoId, item(seed|salt|sugar) 필요' });
    }

    const [user, corn, settings] = await Promise.all([
      User.findOne({ kakaoId }),
      ensureCornDoc(kakaoId),
      CornSettings.findOne({}).lean().catch(() => null)
    ]);
    if (!user) return res.status(404).json({ error: '유저 없음' });

    const price = {
      seed:  Number(settings?.seed ?? settings?.seeds ?? 100),
      salt:  Number(settings?.salt ?? 10),
      sugar: Number(settings?.sugar ?? 20)
    }[it];

    const cost = price * q;
    if ((user.orcx ?? 0) < cost) return res.status(400).json({ error: '토큰 부족' });

    user.orcx = (user.orcx || 0) - cost;
    if (it === 'salt')  corn.additives.salt  = (corn.additives.salt  || 0) + q;
    if (it === 'sugar') corn.additives.sugar = (corn.additives.sugar || 0) + q;
    if (it === 'seed')  corn.seed            = (corn.seed            || 0) + q;

    await user.save();
    await corn.save();

    return res.json({
      success: true,
      wallet: { orcx: user.orcx || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 },
      agri: { seed: corn.seed || 0, seeds: corn.seed || 0 } // ← 호환 키 같이 내려줌
    });
  } catch (e) {
    console.error('buy-additive error', e);
    return res.status(500).json({ error: '구매 실패' });
  }
});

/* =========================================================
   심기/성장/수확/뻥튀기/요약 — CORN ONLY
========================================================= */
app.post('/api/corn/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    const corn = await ensureCornDoc(kakaoId);
    if ((corn.seed || 0) <= 0) return res.status(400).json({ error: '씨앗 부족' });
    corn.seed = (corn.seed || 0) - 1;
    corn.phase = 'GROW';
    corn.g = 0;
    corn.plantedAt = new Date();
    await corn.save();
    return res.json({
      success: true,
      phase: corn.phase, g: corn.g, plantedAt: corn.plantedAt,
      agri: { seed: corn.seed || 0, seeds: corn.seed || 0 }
    });
  } catch (e) {
    console.error('plant error', e);
    return res.status(500).json({ error: '심기 실패' });
  }
});

app.post('/api/corn/grow', async (req, res) => {
  try {
    const { kakaoId, step } = req.body || {};
    const s = clamp(Number(step ?? 5), 1, 30);
    const corn = await ensureCornDoc(kakaoId);
    if (corn.phase !== 'GROW') return res.status(400).json({ error: '성장 단계가 아님' });
    corn.g = clamp((corn.g || 0) + s, 0, 100);
    await corn.save();
    return res.json({ success: true, g: corn.g });
  } catch (e) {
    console.error('grow error', e);
    return res.status(500).json({ error: '성장 실패' });
  }
});

app.post('/api/corn/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    const corn = await ensureCornDoc(kakaoId);
    if (corn.phase !== 'GROW' || (corn.g || 0) < 100) {
      return res.status(400).json({ error: '수확 조건 미충족' });
    }
    // 간단 수확 처리: 등급만 계산, 수확물은 예시로 5개
    const grade = gradeByDays(corn.plantedAt) || 'F';
    const qty = 5; // 상세 로직은 형님 기존 규칙 쓰면 됨
    corn.corn = (corn.corn || 0) + qty;
    corn.phase = 'STUBBLE';
    corn.g = 0;
    await corn.save();
    return res.json({
      success: true,
      grade, qty,
      agri: { corn: corn.corn || 0, seed: corn.seed || 0, seeds: corn.seed || 0 },
      phase: corn.phase
    });
  } catch (e) {
    console.error('harvest error', e);
    return res.status(500).json({ error: '수확 실패' });
  }
});

app.post('/api/corn/pop', async (req, res) => {
  try {
    const { kakaoId, tokenCost } = req.body || {};
    const cost = Number(tokenCost ?? 30);
    const [user, corn] = await Promise.all([
      User.findOne({ kakaoId }),
      ensureCornDoc(kakaoId)
    ]);
    if (!user) return res.status(404).json({ error: '유저 없음' });
    if ((user.orcx || 0) < cost) return res.status(400).json({ error: '토큰 부족' });
    if ((corn.corn || 0) <= 0) return res.status(400).json({ error: '옥수수 부족' });

    // 재료 차감(소금/설탕 1씩 필요하다는 전제)
    if ((corn.additives.salt || 0) <= 0) return res.status(400).json({ error: '소금 부족' });
    if ((corn.additives.sugar || 0) <= 0) return res.status(400).json({ error: '설탕 부족' });

    user.orcx -= cost;
    corn.additives.salt  -= 1;
    corn.additives.sugar -= 1;
    corn.corn -= 1;
    corn.popcorn = (corn.popcorn || 0) + 1;

    await user.save();
    await corn.save();

    return res.json({
      success: true,
      wallet: { orcx: user.orcx || 0 },
      agri: { corn: corn.corn || 0 },
      food: { popcorn: corn.popcorn || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
    });
  } catch (e) {
    console.error('pop error', e);
    return res.status(500).json({ error: '뻥튀기 실패' });
  }
});

app.get('/api/corn/summary', async (req, res) => {
  try {
    const { kakaoId } = req.query || {};
    const corn = await ensureCornDoc(kakaoId);
    return res.json({
      phase: corn.phase,
      g: corn.g,
      plantedAt: corn.plantedAt,
      agri: { seed: corn.seed || 0, seeds: corn.seed || 0, corn: corn.corn || 0 },
      food: { popcorn: corn.popcorn || 0 },
      additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
    });
  } catch (e) {
    console.error('summary error', e);
    return res.status(500).json({ error: '요약 실패' });
  }
});

/* =========================================================
   합본(프론트 초기 로드용)
   - 감자/보리(User) 건드리지 않고, corn만 병합
========================================================= */
app.post('/api/userdata', async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body || {};
    let user = await User.findOne({ kakaoId });
    if (!user) user = await User.create({ kakaoId, nickname: nickname || '' });

    const corn = await ensureCornDoc(kakaoId, nickname || user.nickname || '');

    return res.json({
      user: {
        kakaoId,
        nickname: user.nickname || '',
        wallet: { orcx: user.orcx || 0 },
        inventory: {
          water: user.inventory?.water || 0,
          fertilizer: user.inventory?.fertilizer || 0
        },
        agri: {
          corn: corn.corn || 0,
          seed: corn.seed || 0,
          seeds: corn.seed || 0   // ← 호환 키
        },
        food: { popcorn: corn.popcorn || 0 },
        additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
      }
    });
  } catch (e) {
    console.error('userdata error', e);
    return res.status(500).json({ error: 'userdata 실패' });
  }
});

/* =========================================================
   서버 시작
========================================================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server-unified(corn) on :${PORT}`));

module.exports = app;

/* =========================================================
   [APPEND ONLY] CORN-ONLY ATTACH BLOCK (seed 단수 통일)
   - 기존 코드/라우트/서버 구동(app.listen) 절대 수정/삭제하지 않음
   - 아래 블록은 기존 app/mongoose가 있으면 그 위에 라우트만 "부착"
========================================================= */
;(() => {
  try {
    const __g = (typeof globalThis !== 'undefined' ? globalThis : global);
    const __app = (typeof app !== 'undefined' ? app : (__g.app || __g.__app));
    const __mongoose = (typeof mongoose !== 'undefined' ? mongoose : require('mongoose'));
    if (!__app || !__mongoose) {
      console.warn('[CORN-ATTACH] app 또는 mongoose 를 찾지 못해 부착을 건너뜁니다.');
      return;
    }

    // ---------- 모델 재사용/정의 (이름 충돌 방지) ----------
    const __User = __mongoose.models.User || __mongoose.model('User', new __mongoose.Schema({
      kakaoId:   { type: String, index: true, unique: true },
      nickname:  { type: String, default: '' },
      orcx:      { type: Number, default: 0 },
      inventory: {
        water:     { type: Number, default: 0 },
        fertilizer:{ type: Number, default: 0 }
      }
    }, { collection: 'users', timestamps: true }));

    const __CornSettings = __mongoose.models.CornSettings || __mongoose.model('CornSettings', new __mongoose.Schema({
      seed:  { type: Number, default: 100 },
      salt:  { type: Number, default: 10 },
      sugar: { type: Number, default: 20 }
    }, { collection: 'corn_settings', timestamps: true }));

    const __CornData = __mongoose.models.CornData || __mongoose.model('CornData', new __mongoose.Schema({
      kakaoId:   { type: String, index: true, unique: true },
      nickname:  { type: String, default: '' },
      seed:      { type: Number, default: 0 },
      corn:      { type: Number, default: 0 },
      popcorn:   { type: Number, default: 0 },
      additives: {
        salt:  { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
      },
      phase:     { type: String, default: 'IDLE' }, // IDLE | GROW | STUBBLE
      g:         { type: Number, default: 0 },
      plantedAt: { type: Date }
    }, { collection: 'corn_data', timestamps: true }));

    // ---------- 유틸 ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const toKST = (d) => {
      const t = d ? new Date(d) : new Date();
      const tz = t.getTime() + (9 * 60 * 60 * 1000);
      return new Date(tz);
    };
    const dayNumber = (plantedAt) => {
      if (!plantedAt) return 0;
      const n = toKST(Date.now()); n.setHours(0,0,0,0);
      const p = toKST(plantedAt);  p.setHours(0,0,0,0);
      const diff = Math.floor((n - p) / (24*60*60*1000)) + 1;
      return Math.max(1, diff);
    };
    const gradeByDays = (plantedAt) => {
      const d = dayNumber(plantedAt);
      if (d < 5) return null;
      if (d < 6) return 'A';
      if (d < 7) return 'B';
      if (d < 8) return 'C';
      if (d < 9) return 'D';
      if (d < 10) return 'E';
      return 'F';
    };

    async function ensureCornDoc(kakaoId, nickname = '') {
      if (!kakaoId) throw new Error('kakaoId required');
      let corn = await __CornData.findOne({ kakaoId });
      if (!corn) {
        corn = await __CornData.create({
          kakaoId, nickname,
          seed: 0, corn: 0, popcorn: 0,
          additives: { salt: 0, sugar: 0 },
          phase: 'IDLE', g: 0
        });
      }
      return corn;
    }

    // ---------- 'seeds' → 'seed' 강제 매핑 미들웨어 ----------
    __app.use('/api/corn/buy-additive', (req, _res, next) => {
      try {
        if (req.method === 'POST' && req.body) {
          if (req.body.item === 'seeds') req.body.item = 'seed';
          if (req.body.type === 'seeds') req.body.type = 'seed';
        }
      } catch (_) {}
      next();
    });

    // ---------- 가격판 ----------
    __app.get('/api/corn/priceboard', async (_req, res) => {
      try {
        const doc = await __CornSettings.findOne({}).lean();
        if (!doc) return res.json({ price: { seed: 100, salt: 10, sugar: 20 } });
        const price = {
          seed:  Number(doc.seed ?? doc.seeds ?? 100),
          salt:  Number(doc.salt ?? 10),
          sugar: Number(doc.sugar ?? 20)
        };
        return res.json({ price });
      } catch (e) {
        console.error('[corn] priceboard error', e);
        return res.status(500).json({ error: '가격 조회 실패' });
      }
    });

    // ---------- 구매 ----------
    __app.post('/api/corn/buy-additive', async (req, res) => {
      try {
        const { kakaoId, item, qty, amount } = req.body || {};
        const q = Math.max(1, Number(qty ?? amount ?? 1));
        const it = String(item || '').toLowerCase();
        if (!kakaoId || !['seed','salt','sugar'].includes(it)) {
          return res.status(400).json({ error: 'kakaoId, item(seed|salt|sugar) 필요' });
        }

        const [user, corn, settings] = await Promise.all([
          __User.findOne({ kakaoId }),
          ensureCornDoc(kakaoId),
          __CornSettings.findOne({}).lean().catch(() => null)
        ]);
        if (!user) return res.status(404).json({ error: '유저 없음' });

        const price = {
          seed:  Number(settings?.seed ?? settings?.seeds ?? 100),
          salt:  Number(settings?.salt ?? 10),
          sugar: Number(settings?.sugar ?? 20)
        }[it];

        const cost = price * q;
        if ((user.orcx ?? 0) < cost) return res.status(400).json({ error: '토큰 부족' });

        user.orcx = (user.orcx || 0) - cost;
        if (it === 'salt')  corn.additives.salt  = (corn.additives.salt  || 0) + q;
        if (it === 'sugar') corn.additives.sugar = (corn.additives.sugar || 0) + q;
        if (it === 'seed')  corn.seed            = (corn.seed            || 0) + q;

        await user.save();
        await corn.save();

        return res.json({
          success: true,
          wallet: { orcx: user.orcx || 0 },
          additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 },
          agri: { seed: corn.seed || 0, seeds: corn.seed || 0 }
        });
      } catch (e) {
        console.error('[corn] buy-additive error', e);
        return res.status(500).json({ error: '구매 실패' });
      }
    });

    // ---------- 심기 ----------
    __app.post('/api/corn/plant', async (req, res) => {
      try {
        const { kakaoId } = req.body || {};
        const corn = await ensureCornDoc(kakaoId);
        if ((corn.seed || 0) <= 0) return res.status(400).json({ error: '씨앗 부족' });
        corn.seed = (corn.seed || 0) - 1;
        corn.phase = 'GROW';
        corn.g = 0;
        corn.plantedAt = new Date();
        await corn.save();
        return res.json({
          success: true,
          phase: corn.phase, g: corn.g, plantedAt: corn.plantedAt,
          agri: { seed: corn.seed || 0, seeds: corn.seed || 0 }
        });
      } catch (e) {
        console.error('[corn] plant error', e);
        return res.status(500).json({ error: '심기 실패' });
      }
    });

    // ---------- 성장 ----------
    __app.post('/api/corn/grow', async (req, res) => {
      try {
        const { kakaoId, step } = req.body || {};
        const s = clamp(Number(step ?? 5), 1, 30);
        const corn = await ensureCornDoc(kakaoId);
        if (corn.phase !== 'GROW') return res.status(400).json({ error: '성장 단계가 아님' });
        corn.g = clamp((corn.g || 0) + s, 0, 100);
        await corn.save();
        return res.json({ success: true, g: corn.g });
      } catch (e) {
        console.error('[corn] grow error', e);
        return res.status(500).json({ error: '성장 실패' });
      }
    });

    // ---------- 수확 ----------
    __app.post('/api/corn/harvest', async (req, res) => {
      try {
        const { kakaoId } = req.body || {};
        const corn = await ensureCornDoc(kakaoId);
        if (corn.phase !== 'GROW' || (corn.g || 0) < 100) {
          return res.status(400).json({ error: '수확 조건 미충족' });
        }
        const grade = gradeByDays(corn.plantedAt) || 'F';
        const qty = 5;
        corn.corn = (corn.corn || 0) + qty;
        corn.phase = 'STUBBLE';
        corn.g = 0;
        await corn.save();
        return res.json({
          success: true,
          grade, qty,
          agri: { corn: corn.corn || 0, seed: corn.seed || 0, seeds: corn.seed || 0 },
          phase: corn.phase
        });
      } catch (e) {
        console.error('[corn] harvest error', e);
        return res.status(500).json({ error: '수확 실패' });
      }
    });

    // ---------- 뻥튀기 ----------
    __app.post('/api/corn/pop', async (req, res) => {
      try {
        const { kakaoId, tokenCost } = req.body || {};
        const cost = Number(tokenCost ?? 30);
        const [user, corn] = await Promise.all([
          __User.findOne({ kakaoId }),
          ensureCornDoc(kakaoId)
        ]);
        if (!user) return res.status(404).json({ error: '유저 없음' });
        if ((user.orcx || 0) < cost) return res.status(400).json({ error: '토큰 부족' });
        if ((corn.corn || 0) <= 0) return res.status(400).json({ error: '옥수수 부족' });

        if ((corn.additives.salt || 0) <= 0) return res.status(400).json({ error: '소금 부족' });
        if ((corn.additives.sugar || 0) <= 0) return res.status(400).json({ error: '설탕 부족' });

        user.orcx -= cost;
        corn.additives.salt  -= 1;
        corn.additives.sugar -= 1;
        corn.corn -= 1;
        corn.popcorn = (corn.popcorn || 0) + 1;

        await user.save();
        await corn.save();

        return res.json({
          success: true,
          wallet: { orcx: user.orcx || 0 },
          agri: { corn: corn.corn || 0 },
          food: { popcorn: corn.popcorn || 0 },
          additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
        });
      } catch (e) {
        console.error('[corn] pop error', e);
        return res.status(500).json({ error: '뻥튀기 실패' });
      }
    });

    // ---------- 요약 ----------
    __app.get('/api/corn/summary', async (req, res) => {
      try {
        const { kakaoId } = req.query || {};
        const corn = await ensureCornDoc(kakaoId);
        return res.json({
          phase: corn.phase,
          g: corn.g,
          plantedAt: corn.plantedAt,
          agri: { seed: corn.seed || 0, seeds: corn.seed || 0, corn: corn.corn || 0 },
          food: { popcorn: corn.popcorn || 0 },
          additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
        });
      } catch (e) {
        console.error('[corn] summary error', e);
        return res.status(500).json({ error: '요약 실패' });
      }
    });

    // ---------- 합본(프론트 초기 로드용) ----------
    __app.post('/api/userdata', async (req, res) => {
      try {
        const { kakaoId, nickname } = req.body || {};
        let user = await __User.findOne({ kakaoId });
        if (!user) user = await __User.create({ kakaoId, nickname: nickname || '' });

        const corn = await ensureCornDoc(kakaoId, nickname || user.nickname || '');

        return res.json({
          user: {
            kakaoId,
            nickname: user.nickname || '',
            wallet: { orcx: user.orcx || 0 },
            inventory: {
              water: user.inventory?.water || 0,
              fertilizer: user.inventory?.fertilizer || 0
            },
            agri: {
              corn: corn.corn || 0,
              seed: corn.seed || 0,
              seeds: corn.seed || 0
            },
            food: { popcorn: corn.popcorn || 0 },
            additives: { salt: corn.additives.salt || 0, sugar: corn.additives.sugar || 0 }
          }
        });
      } catch (e) {
        console.error('[corn] userdata error', e);
        return res.status(500).json({ error: 'userdata 실패' });
      }
    });

    console.log('[CORN-ATTACH] corn routes attached.');
  } catch (e) {
    console.error('[CORN-ATTACH] attach failed', e);
  }
})();





