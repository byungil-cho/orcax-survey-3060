// routes/corn.js
const express = require('express');

module.exports = function makeCornRouter(db) {
  const router = express.Router();
  const Users = db.collection('users');         // 물/거름/토큰
  const Corn  = db.collection('corn_data');     // 씨앗/옥수수/팝콘/소금/설탕

  // 공통 유틸
  const n = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  async function getUser(kakaoId){ return Users.findOne({ kakaoId }); }
  async function ensureCorn(kakaoId){
    const doc = await Corn.findOne({ kakaoId });
    if (doc) return doc;
    const base = { kakaoId, corn:0, popcorn:0, seeds:0, additives:{ salt:0, sugar:0 }, phase:'IDLE', g:0, gradeInv:{} };
    await Corn.insertOne(base);
    return base;
  }

  async function summaryHandler(req, res){
    const { kakaoId } = req.body || req.query || {};
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);
    return res.json({
      ok:true,
      wallet: { orcx: n(u?.orcx) },
      agri: { corn: n(c?.corn), seeds: n(c?.seeds) },
      food: { popcorn: n(c?.popcorn) },
      additives: { salt: n(c?.additives?.salt), sugar: n(c?.additives?.sugar) },
      phase: c?.phase || 'IDLE',
      g: n(c?.g),
      gradeInv: c?.gradeInv || {}
    });
  }

  // === 1) 상태 조회 ===
  router.get('/summary', summaryHandler);

  // === 2) 씨앗 구매 ===
  router.post('/buy-seed', async (req, res) => {
    try{
      const { kakaoId, qty=1, price=30 } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const need = Math.max(1, Number(qty)) * Math.max(1, Number(price));
      const u = await getUser(kakaoId);
      if (n(u.orcx) < need) return res.status(400).json({ ok:false, error:'not enough token' });

      await Users.updateOne({ kakaoId }, { $inc:{ orcx: -need } });
      const c = await ensureCorn(kakaoId);
      await Corn.updateOne({ kakaoId }, { $inc:{ seeds: +Math.max(1, Number(qty)) } });
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 3) 심기/성장/수확 ===
  router.post('/plant', async (req, res) => {
    try{
      const { kakaoId, grade='C' } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (n(c.seeds) < 1) return res.status(400).json({ ok:false, error:'no seed' });
      await Corn.updateOne({ kakaoId }, { $inc:{ seeds:-1 }, $set:{ phase:'GROW', g:0 } });
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  router.post('/grow', async (req, res) => {
    try{
      const { kakaoId, step=5 } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const c = await ensureCorn(kakaoId);
      if (c.phase !== 'GROW') return res.status(400).json({ ok:false, error:'not growing' });
      const next = Math.min(100, n(c.g) + Math.max(1, Number(step)));
      await Corn.updateOne({ kakaoId }, { $set:{ g: next }});
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  router.post('/harvest', async (req, res) => {
    try{
      const { kakaoId, grade='C' } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (c.phase !== 'GROW' || n(c.g) < 100) return res.status(400).json({ ok:false, error:'not ready' });

      const gainMap = { A:7, B:6, C:5, D:4, E:3, F:2 };
      const gain = gainMap[grade] ?? 5;

      await Corn.updateOne(
        { kakaoId },
        { $inc:{ corn: gain }, $set:{ phase:'STUBBLE', g:0 }, $inc: { seeds: 0 } }
      );
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 4) 팝콘 만들기 (corn + salt + sugar + token) ===
  router.post('/pop', async (req, res) => {
    try{
      const { kakaoId, tokenCost=30 } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);
      if (n(u.orcx) < tokenCost)        return res.status(400).json({ ok:false, error:'not enough token' });
      if (n(c.corn) < 1)                return res.status(400).json({ ok:false, error:'no corn' });
      if (n(c.additives?.salt) < 1 ||
          n(c.additives?.sugar) < 1)    return res.status(400).json({ ok:false, error:'need salt/sugar' });

      await Users.updateOne({ kakaoId }, { $inc:{ orcx: -tokenCost } });
      await Corn.updateOne(
        { kakaoId },
        { $inc:{ corn:-1, popcorn:+1, 'additives.salt':-1, 'additives.sugar':-1 } }
      );
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 5) 팝콘 → 거름 1:1 교환 ===
  router.post('/exchange', async (req, res) => {
    try{
      const { kakaoId, qty=1 } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (n(c.popcorn) < qty) return res.status(400).json({ ok:false, error:'no popcorn' });

      await Promise.all([
        Corn.updateOne({ kakaoId }, { $inc:{ popcorn: -qty } }),
        Users.updateOne({ kakaoId }, { $inc:{ fertilizer: +qty } }),
      ]);
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  return router;
};
