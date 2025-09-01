// routes/processing.js
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const userdata = require('../routes/userdata');

// 1. 유저 인벤토리/제품 전체 반환
router.post('/get-inventory', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await User.findOne({ kakaoId });
    if(!user) return res.json({ success:false, message:'유저 없음' });
    res.json({ 
      success:true, 
      user: {
        nickname: user.nickname,
        orcx: user.orcx,
        water: user.water,
        fertilizer: user.fertilizer,
        seedPotato: user.seedPotato,
        seedBarley: user.seedBarley,
        storage: user.storage,
        products: user.products || {}
      }
    });
  } catch(e) {
    res.json({ success:false, message:'DB 오류' });
  }
});

// 2. 가공공장: 가공시도 전체 로그 및 조건별 콘솔 진입 추가!
router.post('/make-product', async (req, res) => {
  try {
    console.log("🛠️ [가공시도 req.body]:", req.body); // 요청값 전체 출력

    const { kakaoId, material, product } = req.body;

    if(!kakaoId) { 
      console.log("⛔ 카카오ID 없음");
      return res.json({ success:false, message:'유저 없음' }); 
    }

    if(!product || product.length < 2) {
      console.log("⛔ 제품명 오류:", product);
      return res.json({ success:false, message:'제품명 오류' }); 
    }

    const user = await User.findOne({ kakaoId });
    if(!user) {
      console.log("⛔ DB에 유저 없음");
      return res.json({ success:false, message:'유저 없음' });
    }

    // 감자/보리 자원 체크
    if(material === 'potato' && (user.storage?.gamja||0)<1) {
      console.log("⛔ 감자 부족!");
      return res.json({ success:false, message:'감자 부족!' });
    }
    if(material === 'barley' && (user.storage?.bori||0)<1) {
      console.log("⛔ 보리 부족!");
      return res.json({ success:false, message:'보리 부족!' });
    }
// ---- [ADD-ONLY] 씨앗 표시 유틸 ----
function paintSeeds(seeds){
  const pot = Number(seeds?.potato || 0);
  const bar = Number(seeds?.barley || 0);
  // 페이지마다 ID가 다를 수 있어 다중 매핑
  ['r-seedpot','seed-potato','rSeedPotato','seedPotato'].forEach(id=>{
    const el = document.getElementById(id); if (el) el.textContent = pot;
  });
  ['r-seedbar','seed-barley','rSeedBarley','seedBarley'].forEach(id=>{
    const el = document.getElementById(id); if (el) el.textContent = bar;
  });
}

async function fetchSeeds(kakaoId){
  try{
    const url = `${API_BASE}/api/user/seeds?kakaoId=${encodeURIComponent(kakaoId)}`;
    const r = await fetch(url, { credentials:'include' });
    const j = await r.json();
    if (j?.ok) paintSeeds(j.seeds);
  }catch(_){}
}

// 기존 로그인/유저 페인트 이후 한 줄만 호출 (ADD-ONLY)
document.addEventListener('DOMContentLoaded', ()=>{
  const kid = (window.S?.user?.kakaoId) || localStorage.getItem('kakaoId');
  if (kid) fetchSeeds(kid);
});


    // 자원 차감
    if(material === 'potato') user.storage.gamja -= 1;
    if(material === 'barley') user.storage.bori -= 1;

    // products 강제 생성 및 깊은 복사 저장!
    if(!user.products || typeof user.products !== 'object') user.products = {};
    let newProducts = { ...user.products };
    newProducts[product] = (newProducts[product]||0) + 1;
    user.products = newProducts;
    user.markModified('products');

    await user.save();

    // 저장 후 실제 반영 확인용 로그
    const check = await User.findOne({ kakaoId });
    console.log("✅ 저장 후 products:", check.products);

    res.json({ success:true });
  } catch(e){
    console.log("🔥 [서버 오류]:", e);
    res.json({ success:false, message:'서버 오류' });
  }
});

// 3. 관리자: 전체 제품명+수량 집계 (모든 유저 products 합산)
router.get('/admin/all-products', async (req, res) => {
  try {
    const all = await User.find({}, { products:1 });
    const counter = {};
    all.forEach(u=>{
      if(u.products){
        Object.entries(u.products).forEach(([k,v])=>{
          counter[k] = (counter[k]||0)+v;
        });
      }
    });
    const list = Object.entries(counter).map(([k,v])=>({ name:k, count:v }));
    res.json({ success:true, list });
  } catch(e){
    res.json({ success:false, message:'집계 오류' });
  }
});

module.exports = router;
