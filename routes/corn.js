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

  // === 1) 요약 (프론트가 처음 불러오는 엔드포인트) ===
  async function summaryHandler(req, res) {
    try{
      const { kakaoId } = req.body || {};
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);
      if (!u) return res.status(404).json({ ok:false, error:'user not found' });

      const user = {
        kakaoId,
        nickname: u.nickname,
        level: n(u.level),
        profile: { exp: n(u.exp) },
        wallet: { orcx: n(u.orcx) },
        inventory: { water: n(u.water), fertilizer: n(u.fertilizer) },
        additives: { salt: n(c.additives?.salt), sugar: n(c.additives?.sugar) },
        seeds: n(c.seeds),
        agri: {
          corn: n(c.corn),
          popcorn: n(c.popcorn),
          phase: c.phase || 'IDLE',
          g: n(c.g),
          gradeInv: c.gradeInv || {}
        }
      };
      res.json({ ok:true, user });
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  }

  router.post('/summary', summaryHandler);
  // 프론트가 여러 후보를 때리니 전부 같은 핸들러로 연결
  router.post('/data',    summaryHandler);
  router.post('/status',  summaryHandler);
  router.post('/get',     summaryHandler);

  // === 2) 씨앗: 구매/심기 ===
  // op:'buy'  -> users.orcx 차감 + corn_data.seeds 증가
  // op:'plant'-> corn_data.seeds 감소 + phase/g 초기화
  router.post('/seed', async (req, res) => {
    try{
      const { kakaoId, op, seed='corn', qty=1, tokenCost=100 } = req.body || {};
      if (!kakaoId || !op) return res.status(400).json({ ok:false, error:'kakaoId/op required' });

      const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);
      if (!u) return res.status(404).json({ ok:false, error:'user not found' });

      if (op === 'buy'){
        if (n(u.orcx) < tokenCost) return res.status(400).json({ ok:false, error:'not enough token' });
        await Users.updateOne({ kakaoId }, { $inc:{ orcx: -tokenCost } });
        await Corn.updateOne({ kakaoId }, { $inc:{ seeds: qty } });
      } else if (op === 'plant'){
        if (n(c.seeds) < qty) return res.status(400).json({ ok:false, error:'no seeds' });
        await Corn.updateOne({ kakaoId }, { $inc:{ seeds: -qty }, $set:{ phase:'GROW', g:0 } });
      } else {
        return res.status(400).json({ ok:false, error:'unknown op' });
      }
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 3) 수확 ===
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

  // === 5) 팝콘 -> 거름 교환 ===
  router.post('/exchange/pop-to-fert', async (req, res) => {
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
