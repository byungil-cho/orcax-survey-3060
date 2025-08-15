const router = require('express').Router();
const CornConfig = require('../models/CornConfig');
// ... User 모델 등 기존 require 유지

function toKST(d){ const x=new Date(d); return new Date(x.getTime() - x.getTimezoneOffset()*60000 + 9*60*60000); }
function gradeByDays(plantedAt){
  const now = toKST(new Date());
  const planted = toKST(plantedAt);
  const days = (now - planted) / (1000*60*60*24);
  if (days < 5.0) return null;
  if (days < 6.0) return 'A';
  if (days < 7.0) return 'B';
  if (days < 8.0) return 'C';
  if (days < 9.0) return 'D';
  if (days < 10.0) return 'E';
  return 'F';
}
function pickWeighted(weights){
  const s = weights.reduce((a,b)=>a+b,0);
  let r = Math.random()*s;
  for (let i=0;i<weights.length;i++){ r-=weights[i]; if(r<0) return i; }
  return weights.length-1;
}

router.post('/pop', async (req,res) => {
  try{
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ message:'kakaoId required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message:'user not found' });

    // 첨가물 체크
    const additive = user.inventory?.additive ?? 0;
    if (additive <= 0) return res.status(400).json({ message:'첨가물이 부족합니다.' });

    // 설정 로드 (없으면 기본 자동 생성)
    const cfg = await (await import('../models/CornConfig.js')).default?.getOrInit?.() || await CornConfig.findOne({ key:'global' }) || await CornConfig.create({
      key:'global',
      grades:{
        A:{ tokenRate:0.9, popcornRate:0.1, tokenTable:[1000,900,800] },
        B:{ tokenRate:0.7, popcornRate:0.3, tokenTable:[800,700,600] },
        C:{ tokenRate:0.6, popcornRate:0.4, tokenTable:[600,500,400] },
        D:{ tokenRate:0.5, popcornRate:0.5, tokenTable:[400,300,200] },
        E:{ tokenRate:0.4, popcornRate:0.6, tokenTable:[200,100,50]  },
        F:{ tokenRate:0.3, popcornRate:0.7, tokenTable:[100,50,10]   },
      },
      preset:{ "5":[2,1,1,1], "7":[1,3,2,1], "9":[1,3,4,1] },
      updatedBy:'system'
    });

    // 최근 수확 정보
    const last = user.corn?.lastHarvest || {};
    const qty = Number(last.qty || 5);
    const plantedAt = last.plantedAt || user.corn?.plantedAt;
    let grade = last.grade || gradeByDays(plantedAt) || 'F';

    const gcfg = cfg.grades[grade] || cfg.grades.F;
    const table = gcfg.tokenTable;
    const pToken = Number(gcfg.tokenRate || 0.3);

    // 분배 계산
    let hi=0, mid=0, low=0, pop=0;
    const preset = cfg.preset[String(qty)];
    if (preset && preset.length===4){
      [hi,mid,low,pop] = preset.map(n=>Number(n));
    }else{
      for (let i=0;i<qty;i++){
        if (Math.random() < pToken){
          const idx = pickWeighted([1,1,1]); // hi/mid/low 균등
          if (idx===0) hi++; else if (idx===1) mid++; else low++;
        } else { pop++; }
      }
    }

    const sumToken = hi*table[0] + mid*table[1] + low*table[2];

    // 재고 업데이트
    user.inventory = user.inventory || {};
    user.inventory.popcorn = (user.inventory.popcorn || 0) + pop;
    user.token = (user.token || 0) + sumToken;
    user.inventory.additive = additive - 1;

    user.corn = user.corn || {};
    user.corn.lastPop = {
      at: new Date().toISOString(),
      grade, qty,
      breakdown:{ hi, mid, low, pop },
      tokenTable: table, tokenGained: sumToken
    };

    await user.save();

    return res.json({
      ok:true,
      grade, qty,
      breakdown:{ hi, mid, low, pop },
      tokenTable: table,
      tokenGained: sumToken,
      popcornGained: pop,
      additiveLeft: user.inventory.additive,
      tokenTotal: user.token,
      popcornTotal: user.inventory.popcorn
    });
  }catch(err){
    console.error(err);
    res.status(500).json({ message:'POP_FAILED', error:String(err?.message||err) });
  }
});

module.exports = router;
