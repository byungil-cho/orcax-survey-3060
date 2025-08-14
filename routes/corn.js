// routes/corn.js
const express = require('express');

module.exports = function makeCornRouter(db) {
  const router = express.Router();
  const Users = db.collection('users');         // 물/거름/토큰
  const Corn  = db.collection('corn_data');     // 씨앗/옥수수/팝콘/소금/설탕

  // -----------------------------------------------------------------------
  // 공통 유틸 (기존 n 유지 + 숫자 안전 변환 보강용 num 추가)
  // -----------------------------------------------------------------------
  const n   = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);      // 기존 호환
  const num = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; }; // 문자열 숫자도 허용

  const getKakaoId = (req) => (req.body && req.body.kakaoId) || (req.query && req.query.kakaoId) || null;

  async function getUser(kakaoId){ return Users.findOne({ kakaoId }); }

  async function ensureCorn(kakaoId){
    const found = await Corn.findOne({ kakaoId });
    if (found) {
      // 필드 보정(누락 방지)
      found.additives = found.additives || { salt:0, sugar:0 };
      return found;
    }
    const base = {
      kakaoId, corn:0, popcorn:0, seeds:0,
      additives:{ salt:0, sugar:0 },
      phase:'IDLE', g:0, gradeInv:{}
    };
    await Corn.insertOne(base);
    return base;
  }

  // -----------------------------------------------------------------------
  // 합산 요약: 프론트 상단 헤더/미니뷰 등에서 사용
  // -----------------------------------------------------------------------
  async function summaryHandler(req, res){
    try {
      const kakaoId = getKakaoId(req);
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);

      return res.json({
        ok:true,
        wallet: { orcx: num(u && u.orcx) },
        // 필요 시 UI에서 쓸 수 있도록 최소 필수만 반환
        agri: { corn: num(c && c.corn), seeds: num(c && c.seeds) },
        food: { popcorn: num(c && c.popcorn) },
        additives: { salt: num(c && c.additives && c.additives.salt), sugar: num(c && c.additives && c.additives.sugar) },
        phase: (c && c.phase) || 'IDLE',
        g: num(c && c.g),
        gradeInv: (c && c.gradeInv) || {}
      });
    } catch (e) {
      res.status(500).json({ ok:false, error:String(e) });
    }
  }

  // === 1) 상태 조회 (기존 유지) ===
  router.get('/summary', summaryHandler);

  // === 2) 씨앗 구매 (기존 유지) ===
  router.post('/buy-seed', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      const qty  = Math.max(1, num(req.body && req.body.qty));
      const price = Math.max(1, num((req.body && req.body.price) || 30)); // 기본 30

      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
      const need = qty * price;
      const u = await getUser(kakaoId);
      if (num(u && u.orcx) < need) return res.status(400).json({ ok:false, error:'not enough token' });

      await Users.updateOne({ kakaoId }, { $inc:{ orcx: -need } });
      await ensureCorn(kakaoId);
      await Corn.updateOne({ kakaoId }, { $inc:{ seeds: +qty } });

      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 2-1) [ADD] 첨가물/씨앗 구매 (salt|sugar|seed) ===
  // corn-api.js 없이도 클라이언트가 이 라우트만 부르면 됨
  router.post('/buy-additive', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      let   item = (req.body && req.body.item) || '';
      const qty  = Math.max(1, num(req.body && req.body.qty));
      if (item === 'seeds') item = 'seed'; // 호환

      if (!kakaoId || !['salt','sugar','seed'].includes(item)) {
        return res.status(400).json({ ok:false, error:'kakaoId and item(salt|sugar|seed) required' });
      }

      // 기본 단가(필요시 서버 전역 설정으로 치환 가능)
      const PRICES = { salt:10, sugar:20, seed:30 };
      const need = PRICES[item] * qty;

      const u = await getUser(kakaoId);
      if (num(u && u.orcx) < need) return res.status(400).json({ ok:false, error:'not enough token' });

      // 토큰 차감
      await Users.updateOne({ kakaoId }, { $inc:{ orcx: -need } });

      // 코어 데이터 반영
      const c = await ensureCorn(kakaoId);
      if (item === 'seed') {
        await Corn.updateOne({ kakaoId }, { $inc:{ seeds: +qty } });
      } else {
        const inc = {};
        inc[`additives.${item}`] = +qty;
        await Corn.updateOne({ kakaoId }, { $inc: inc });
      }

      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 3) 심기/성장/수확 (기존 유지) ===
  router.post('/plant', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      const grade   = (req.body && req.body.grade) || 'C';
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (num(c.seeds) < 1) return res.status(400).json({ ok:false, error:'no seed' });

      await Corn.updateOne({ kakaoId }, { $inc:{ seeds:-1 }, $set:{ phase:'GROW', g:0, grade } });
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  router.post('/grow', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      const step = Math.max(1, num((req.body && req.body.step) || 5));
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (c.phase !== 'GROW') return res.status(400).json({ ok:false, error:'not growing' });

      const next = Math.min(100, num(c.g) + step);
      await Corn.updateOne({ kakaoId }, { $set:{ g: next }});
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  router.post('/harvest', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      const grade   = (req.body && req.body.grade) || 'C';
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (c.phase !== 'GROW' || num(c.g) < 100) return res.status(400).json({ ok:false, error:'not ready' });

      const gainMap = { A:7, B:6, C:5, D:4, E:3, F:2 };
      const gain = gainMap[grade] ?? 5;

      await Corn.updateOne(
        { kakaoId },
        { $inc:{ corn: gain }, $set:{ phase:'STUBBLE', g:0 }, $inc: { seeds: 0 } }
      );
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 4) 팝콘 만들기 (corn + salt + sugar + token) (기존 유지) ===
  router.post('/pop', async (req, res) => {
    try{
      const kakaoId  = getKakaoId(req);
      const tokenCost = Math.max(0, num((req.body && req.body.tokenCost) || 30));
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const [u, c] = await Promise.all([ getUser(kakaoId), ensureCorn(kakaoId) ]);
      if (num(u && u.orcx) < tokenCost)           return res.status(400).json({ ok:false, error:'not enough token' });
      if (num(c && c.corn) < 1)                   return res.status(400).json({ ok:false, error:'no corn' });
      if (num(c && c.additives && c.additives.salt) < 1 ||
          num(c && c.additives && c.additives.sugar) < 1) return res.status(400).json({ ok:false, error:'need salt/sugar' });

      await Users.updateOne({ kakaoId }, { $inc:{ orcx: -tokenCost } });
      await Corn.updateOne(
        { kakaoId },
        { $inc:{ corn:-1, popcorn:+1, 'additives.salt':-1, 'additives.sugar':-1 } }
      );
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // === 5) 팝콘 → 거름 1:1 교환 (기존 유지) ===
  router.post('/exchange', async (req, res) => {
    try{
      const kakaoId = getKakaoId(req);
      const qty = Math.max(1, num(req.body && req.body.qty));
      if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

      const c = await ensureCorn(kakaoId);
      if (num(c && c.popcorn) < qty) return res.status(400).json({ ok:false, error:'no popcorn' });

      await Promise.all([
        Corn.updateOne({ kakaoId }, { $inc:{ popcorn: -qty } }),
        Users.updateOne({ kakaoId }, { $inc:{ fertilizer: +qty } }),
      ]);
      return summaryHandler(req, res);
    }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
  });

  // -----------------------------------------------------------------------
  // (남겨두기) 브라우저용 경로 보정 스니펫이 섞여 있을 경우 서버에서 오류 안 나게 가드
  //   - 원래는 프론트 전용이라 서버 파일에 있으면 window 참조로 죽음
  //   - 삭제 대신 안전가드로 감싸 부작용 제거 (요청대로 "삭제 없이 추가" 원칙 유지)
  // -----------------------------------------------------------------------
  try {
    if (typeof window !== 'undefined' && window && window.fetch) {
      (function () {
        try {
          var raw = (typeof localStorage !== 'undefined') && localStorage.getItem('orcax:BASE_API');
          if (raw) {
            var trimmed = String(raw).replace(/\/+$/,'');
            var baseNoApi = trimmed.replace(/\/api\/?$/i,'');
            var normalized = baseNoApi + '/api';
            if (normalized !== raw && typeof localStorage !== 'undefined') {
              localStorage.setItem('orcax:BASE_API', normalized);
            }
          }
          var __fetch = window.fetch;
          window.fetch = function (url, opts) {
            if (typeof url === 'string') url = url.replace(/\/api\/api\//gi, '/api/');
            return __fetch.call(this, url, opts);
          };
        } catch {}
      })();
    }
  } catch {}

  return router;
};
