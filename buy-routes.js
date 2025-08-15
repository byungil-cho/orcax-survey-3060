/**
 * buy-routes.js
 * - 프런트에서 /api/store/buy -> /api/shop/buy -> /api/buy 순으로 폴백 호출
 * - 여기서는 세 경로를 모두 받는다 (충돌 없이 추가만)
 * - 기존 서버 유틸(getUser, saveUser) 주입 방식으로 안전 장착
 */
module.exports = function(app, deps = {}) {
  const getUser = deps.getUser || dummyGetUser;
  const saveUser = deps.saveUser || dummySaveUser;

  // 가격표
  const PRICES = { seed:100, salt:10, sugar:20 };

  // 내부 처리
  async function applyPurchase(user, items){
    const seed  = Number(items.seed  || 0);
    const salt  = Number(items.salt  || 0);
    const sugar = Number(items.sugar || 0);

    const total = (seed*PRICES.seed) + (salt*PRICES.salt) + (sugar*PRICES.sugar);
    if(total <= 0){
      return { ok:false, reason:'EMPTY' };
    }
    if((user.token ?? 0) < total){
      return { ok:false, reason:'NOT_ENOUGH_TOKEN' };
    }

    user.token -= total;
    user.inventory = user.inventory || {};
    user.inventory.seed  = (user.inventory.seed  || 0) + seed;
    user.inventory.salt  = (user.inventory.salt  || 0) + salt;
    user.inventory.sugar = (user.inventory.sugar || 0) + sugar;

    await saveUser(user);
    return { ok:true, token:user.token, inventory:user.inventory };
  }

  async function handler(req, res){
    try{
      const uid = (req.user && (req.user.id || req.user._id)) || req.body.userId || 'guest';
      const user = await getUser(uid);
      if(!user) return res.status(401).json({ ok:false, reason:'NO_USER' });

      const items = req.body.items || {};
      const result = await applyPurchase(user, items);
      if(!result.ok){
        if(result.reason === 'NOT_ENOUGH_TOKEN') return res.status(400).json(result);
        return res.status(400).json(result);
      }

      // 프런트에서 바로 상단 바 갱신이 가능하도록 최소 요약 포함
      const summary = {
        ok:true,
        token: result.token,
        inventory: result.inventory,
      };
      return res.json(summary);
    }catch(e){
      console.error('[BUY]', e);
      res.status(500).json({ ok:false, reason:'SERVER', detail:String(e) });
    }
  }

  // 세 경로 모두 지원(기존 프론트 어떤 걸 쓰더라도 404 안 나게)
  app.post('/api/store/buy', handler);
  app.post('/api/shop/buy', handler);
  app.post('/api/buy',       handler);
};

/* ====== 스텁 (getUser/saveUser가 없을 때 임시 보관용) ====== */
/* 실제 프로젝트에서는 DB에서 불러오고 저장하세요. */
const _mem = new Map();
async function dummyGetUser(uid){
  if(!_mem.has(uid)){
    _mem.set(uid, { id:uid, token: 52000, inventory: { seed:0, salt:0, sugar:0 } });
  }
  return _mem.get(uid);
}
async function dummySaveUser(user){
  _mem.set(user.id || user._id || 'guest', user);
}
