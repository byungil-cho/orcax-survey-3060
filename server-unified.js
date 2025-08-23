// server-unified.js — 최종 복구판 (감자/보리/마켓/마이페이지 + 옥수수)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 3060;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orcax';
const DB_NAME   = process.env.DB_NAME   || 'orcax';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

// CORS (원하면 .env의 ALLOW_ORIGINS로 제한)
const allow = (process.env.ALLOW_ORIGINS || '')
  .split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allow.length === 0 || allow.some(a => origin.startsWith(a))) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));

/* -------------------- Mongo 연결 -------------------- */
let client, db;
const N = v => Number.isFinite(+v) ? +v : 0;

async function start() {
  client = await MongoClient.connect(MONGO_URI, { ignoreUndefined: true });
  db = client.db(DB_NAME);
  console.log('✅ Mongo connected:', DB_NAME);

  // 인덱스
  await db.collection('users').createIndex({ kakaoId: 1 }, { unique: true });
  await db.collection('corn_data').createIndex({ kakaoId: 1 }, { unique: true });

  app.listen(PORT, () => {
    console.log(`🚀 Unified server on http://localhost:${PORT}`);
  });
}

function col(name){ if(!db) throw new Error('DB not ready'); return db.collection(name); }

/* -------------------- 공통 유틸 -------------------- */
async function ensureUser(kakaoId, nickname='Guest'){
  const U = col('users');
  let u = await U.findOne({ kakaoId });
  if (!u){
    u = {
      kakaoId, nickname,
      water: 0, fertilizer: 0,
      orcx: 0, tokens: 0,                 // tokens=orcx 동기화
      storage: { gamja:0, bori:0 },
      products: {}, growth: {},
      createdAt: new Date(), updatedAt: new Date()
    };
    try { await U.insertOne(u); } catch {}
    u = await U.findOne({ kakaoId });
  } else {
    const $set = { updatedAt: new Date() };
    if (nickname && nickname !== u.nickname) $set.nickname = nickname;
    await U.updateOne({ kakaoId }, { $set });
    u = await U.findOne({ kakaoId });
  }
  return u;
}

async function ensureCorn(kakaoId){
  const C = col('corn_data');
  let c = await C.findOne({ kakaoId });
  if (!c){
    c = { kakaoId, corn:0, popcorn:0, seed:0, seeds:0, additives:{ salt:0, sugar:0 } };
    try { await C.insertOne(c); } catch {}
    c = await C.findOne({ kakaoId });
  }
  return c;
}

function syncORCX(u, next){
  // orcx <-> tokens 동기화
  if ('orcx' in next)  u.orcx  = N(next.orcx);
  if ('tokens' in next) u.tokens = N(next.tokens);
  if (!('orcx' in next))   u.orcx   = N(u.orcx ?? u.tokens ?? 0);
  if (!('tokens' in next)) u.tokens = N(u.tokens ?? u.orcx ?? 0);
  return u;
}

function flatUser(u){
  u = syncORCX(u,{});
  return {
    success:true,
    kakaoId:u.kakaoId, nickname:u.nickname,
    water:N(u.water), fertilizer:N(u.fertilizer),
    tokens:N(u.tokens), orcx:N(u.orcx),
    storage:u.storage||{ gamja:0, bori:0 }
  };
}
// --- Corn SUMMARY compat shim (항상 제공)
app.get('/api/corn/summary', async (req, res) => {
  try {
    const { kakaoId } = req.query;
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    // users / corn_data 보장 후 요약 구성
    let u = await ensureUser(kakaoId);
    let c = await ensureCorn(kakaoId);

    // orcx/tokens 동기화
    const orcx = Number.isFinite(+u.orcx) ? +u.orcx
                : Number.isFinite(+u.tokens) ? +u.tokens : 0;

    return res.json({
      ok: true,
      wallet:     { orcx },
      inventory:  { water: +u.water || 0, fertilizer: +u.fertilizer || 0 },
      agri:       { corn: +c.corn || 0, seeds: (+c.seed || 0) + (+c.seeds || 0) },
      additives:  { salt: +(c.additives?.salt || 0), sugar: +(c.additives?.sugar || 0) },
      food:       { popcorn: +c.popcorn || 0 },
    });
  } catch (e) {
    console.error('[compat /api/corn/summary]', e);
    res.status(500).json({ ok: false });
  }
});

/* -------------------- 헬스 -------------------- */
app.get('/api/health', (_req,res)=>res.json({ ok:true, ts:Date.now() }));
app.get('/health',     (_req,res)=>res.json({ ok:true, ts:Date.now() }));

/* -------------------- 로그인/유저 보장 -------------------- */
// 구 프론트는 /api/login만 치고 본문을 안 볼 수도 있음 → 200만 리턴
app.all('/api/login', async (req,res)=>{
  try{
    const { kakaoId, nickname } = (req.method==='GET'? req.query : req.body) || {};
    if (kakaoId) await ensureUser(kakaoId, nickname);
    res.status(200).json({ ok:true });
  }catch(e){ console.error('[login]',e); res.status(200).json({ ok:true }); }
});

// init-user (GET/POST 모두 지원, users + corn_data 동시 보장)
async function initUserCore(kakaoId, nickname){
  const u = await ensureUser(kakaoId, nickname);
  await ensureCorn(kakaoId);
  return flatUser(u);
}
app.get('/api/init-user', async (req,res)=>{
  try{
    const { kakaoId, nickname='Guest' } = req.query;
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
    res.json(await initUserCore(kakaoId, nickname));
  }catch(e){ console.error('[GET init-user]',e); res.status(500).json({ success:false }); }
});
app.post('/api/init-user', async (req,res)=>{
  try{
    const { kakaoId, nickname='Guest' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
    res.json(await initUserCore(kakaoId, nickname));
  }catch(e){ console.error('[POST init-user]',e); res.status(500).json({ success:false }); }
});

/* -------------------- 감자/보리/마이페이지 호환 -------------------- */
// 상태 저장
app.post('/api/userdata', async (req,res)=>{
  try{
    const { kakaoId, nickname, ...rest } = req.body || {};
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
    await ensureUser(kakaoId, nickname);
    const U = col('users');
    const $set = { updatedAt:new Date() };
    ['water','fertilizer','orcx','tokens','storage','products','growth'].forEach(k=>{
      if (k in rest) $set[k] = rest[k];
    });
    if (nickname) $set.nickname = nickname;
    await U.updateOne({ kakaoId }, { $set });
    const u = await U.findOne({ kakaoId });
    res.json(flatUser(u));
  }catch(e){ console.error('[userdata]',e); res.status(500).json({ success:false }); }
});

// 닉네임 프로필
app.get('/api/user/profile/:nickname', async (req,res)=>{
  try{
    const U = col('users');
    const u = await U.findOne({ nickname: req.params.nickname });
    if (!u) return res.status(404).json({ ok:false, message:'not found' });
    u = syncORCX(u,{});
    res.json({ ok:true, profile:{
      kakaoId:u.kakaoId, nickname:u.nickname,
      orcx:N(u.orcx), water:N(u.water), fertilizer:N(u.fertilizer),
      storage:u.storage||{}, products:u.products||{}
    }});
  }catch(e){ console.error('[profile]',e); res.status(500).json({ ok:false }); }
});

// 재고 (감자/보리/마켓 공용)
async function buildInventory(kakaoId){
  const U = col('users');
  let u = await U.findOne({ kakaoId });
  if (!u) return null;
  u = syncORCX(u,{});
  return {
    ok:true,
    inventory:{
      water:N(u.water), fertilizer:N(u.fertilizer),
      potatoSeeds:N(u.seedPotato || u.storage?.potatoSeeds || 0),
      barleySeeds:N(u.seedBarley  || u.storage?.barleySeeds  || 0),
      storage: u.storage || { gamja:0, bori:0 }
    },
    wallet:{ orcx:N(u.orcx) }
  };
}
app.post('/api/processing/get-inventory', async (req,res)=>{
  try{
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const inv = await buildInventory(kakaoId);
    if (!inv) return res.status(404).json({ ok:false, message:'user not found' });
    res.json(inv);
  }catch(e){ console.error('[get-inventory]',e); res.status(500).json({ ok:false }); }
});

// (구) 마켓 호환
app.post('/api/market/user-inventory', async (req,res)=>{
  try{
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const inv = await buildInventory(kakaoId);
    if (!inv) return res.status(404).json({ ok:false, message:'user not found' });
    res.json(inv);
  }catch(e){ console.error('[market/user-inventory]',e); res.status(500).json({ ok:false }); }
});

// 마켓 가격판 (304 지원)
let PB = { salt:10, sugar:20, seed:30, currency:'ORCX' };
let PB_Last = new Date();
app.get('/api/market/price-board', (req,res)=>{
  res.set('Cache-Control','public, max-age=60');
  res.set('Last-Modified', PB_Last.toUTCString());
  res.json(PB);
});

/* -------------------- 옥수수 엔진 -------------------- */
// 외부 모듈(routes/corn.js)이 있으면 우선 사용
let cornExternal = false;
try{
  const ext = require('./routes/corn');
  app.use('/api/corn', (ext.default || ext));
  cornExternal = true;
  console.log('🌽 External corn engine attached');
}catch{ console.log('🌽 No external corn engine, use built-in'); }

if (!cornExternal){
  const router = express.Router();

  async function getPB(){ return PB; } // 내장판은 마켓과 공유

  // 요약
  router.get('/summary', async (req,res)=>{
    try{
      const { kakaoId } = req.query;
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      let u = await ensureUser(kakaoId);
      let c = await ensureCorn(kakaoId);
      u = syncORCX(u,{});
      res.json({
        ok:true,
        wallet:{ orcx:N(u.orcx) },
        inventory:{ water:N(u.water), fertilizer:N(u.fertilizer) },
        agri:{ corn:N(c.corn), seeds:N(c.seed)+N(c.seeds) },
        additives:{ salt:N(c.additives?.salt), sugar:N(c.additives?.sugar) },
        food:{ popcorn:N(c.popcorn) }
      });
    }catch(e){ console.error('[corn summary]',e); res.status(500).json({ ok:false }); }
  });

  router.get('/priceboard', async (_req,res)=>{ res.json(await getPB()); });

  router.post('/buy-additive', async (req,res)=>{
    try{
      let { kakaoId, item, qty } = req.body || {};
      if (!kakaoId || !item) return res.status(400).json({ error:'params' });
      qty = Math.max(1, N(qty));
      if (item==='seeds') item='seed';
      if (!['salt','sugar','seed'].includes(item)) return res.status(400).json({ error:'item' });

      let u = await ensureUser(kakaoId);
      let c = await ensureCorn(kakaoId);
      const pb = await getPB();
      const unit = item==='salt'?pb.salt:item==='sugar'?pb.sugar:pb.seed;
      const cost = unit*qty;

      u = syncORCX(u,{});
      if (u.orcx < cost) return res.status(402).json({ error:'ORCX 부족' });

      u.orcx -= cost; u.tokens = u.orcx;
      if (item==='seed') c.seed = N(c.seed) + qty;
      else { c.additives = c.additives || {}; c.additives[item] = N(c.additives[item]) + qty; }

      await Promise.all([
        col('users').updateOne({ kakaoId }, { $set:{ orcx:u.orcx, tokens:u.tokens }}),
        col('corn_data').updateOne({ kakaoId }, { $set:c })
      ]);
      res.json({ ok:true });
    }catch(e){ console.error('[buy-additive]',e); res.status(500).json({ error:'server' }); }
  });

  router.post('/plant', async (req,res)=>{
    try{
      const { kakaoId } = req.body || {};
      if (!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const C = col('corn_data');
      const c = await ensureCorn(kakaoId);
      const total = N(c.seed)+N(c.seeds);
      if (total < 1) return res.status(400).json({ error:'no seeds' });
      if (N(c.seed)>0) c.seed = N(c.seed)-1; else c.seeds = Math.max(0, N(c.seeds)-1);
      await C.updateOne({ kakaoId }, { $set:c });
      res.json({ ok:true, seeds:N(c.seed)+N(c.seeds) });
    }catch(e){ console.error('[plant]',e); res.status(500).json({ error:'server' }); }
  });

  router.post('/harvest', async (req,res)=>{
    try{
      const { kakaoId } = req.body || {};
      if (!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const C = col('corn_data');
      const c = await ensureCorn(kakaoId);
      const gain = 5 + Math.floor(Math.random()*4);
      c.corn = N(c.corn) + gain;
      await C.updateOne({ kakaoId }, { $set:c });
      res.json({ ok:true, gain, corn:c.corn });
    }catch(e){ console.error('[harvest]',e); res.status(500).json({ error:'server' }); }
  });

  router.post('/pop', async (req,res)=>{
    try{
      const { kakaoId, use } = req.body || {};
      if (!kakaoId) return res.status(400).json({ error:'kakaoId' });
      let u = await ensureUser(kakaoId);
      const C = col('corn_data');
      const c = await ensureCorn(kakaoId);
      if (N(c.corn) < 1) return res.status(400).json({ error:'no corn' });

      let pick = use==='sugar' ? 'sugar' : 'salt';
      if (N(c.additives?.[pick]) < 1){
        const other = pick==='salt' ? 'sugar' : 'salt';
        if (N(c.additives?.[other]) < 1) return res.status(400).json({ error:'no additives' });
        pick = other;
      }
      c.corn = N(c.corn) - 1; c.additives[pick] = N(c.additives[pick]) - 1;

      const POP = Math.random() < 0.6;
      let qty;
      if (POP){
        qty = [1,2][Math.floor(Math.random()*2)];
        c.popcorn = N(c.popcorn) + qty;
      } else {
        qty = [1,2,3,5][Math.floor(Math.random()*4)];
        u = syncORCX(u,{ orcx: N(u.orcx) + qty, tokens: N(u.orcx) + qty });
      }

      await Promise.all([
        col('users').updateOne({ kakaoId }, { $set:{ orcx:u.orcx, tokens:u.tokens }}),
        C.updateOne({ kakaoId }, { $set:c })
      ]);

      res.json({ ok:true, result: POP?'popcorn':'token', qty });
    }catch(e){ console.error('[pop]',e); res.status(500).json({ error:'server' }); }
  });

  router.post('/exchange', async (req,res)=>{
    try{
      const { kakaoId, dir, qty=1 } = req.body || {};
      if (!kakaoId) return res.status(400).json({ error:'kakaoId' });
      const q = Math.max(1, N(qty));
      let u = await ensureUser(kakaoId);
      const C = col('corn_data');
      const c = await ensureCorn(kakaoId);

      if (dir==='fertilizer->popcorn'){
        if (N(u.fertilizer) < q) return res.status(400).json({ error:'no fertilizer' });
        u.fertilizer = N(u.fertilizer) - q; c.popcorn = N(c.popcorn) + q;
        await Promise.all([
          col('users').updateOne({ kakaoId }, { $set:{ fertilizer:u.fertilizer }}),
          C.updateOne({ kakaoId }, { $set:c })
        ]);
      } else {
        if (N(c.popcorn) < q) return res.status(400).json({ error:'no popcorn' });
        c.popcorn = N(c.popcorn) - q; u.fertilizer = N(u.fertilizer) + q;
        await Promise.all([
          col('users').updateOne({ kakaoId }, { $set:{ fertilizer:u.fertilizer }}),
          C.updateOne({ kakaoId }, { $set:c })
        ]);
      }
      res.json({ ok:true });
    }catch(e){ console.error('[exchange]',e); res.status(500).json({ error:'server' }); }
  });

  app.use('/api/corn', router);
}

/* -------------------- 시작 -------------------- */
start().catch(err => {
  console.error('❌ Start failed:', err);
  process.exit(1);
});

process.on('SIGINT', async ()=>{
  try { await client?.close(); } catch {}
  process.exit(0);
});

























