// routes/processing.js
const express = require('express');
const router = express.Router();
const User = require('../models/users');

// 서버 라우터 적용 여부 강제 확인 로그!
console.log("🔥 processing.js 라우터 파일이 서버에 적용됨!");

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

// 2. 가공공장: 자유 제품명 가공/저장 (감자/보리 차감, 제품+1)
router.post('/make-product', async (req, res) => {
  try {
    console.log("🛠️ [가공시도 req.body]:", req.body); // 요청값 전체 출력

    const { kakaoId, material, product } = req.body;
    const user = await User.findOne({ kakaoId });
    if(!user) {
      console.log("⛔ 유저 없음");
      return res.json({ success:false, message:'유저 없음' });
    }
    if(!product || product.length<2) {
      console.log("⛔ 제품명 오류:", product);
      return res.json({ success:false, message:'제품명 오류' });
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

    // 자원 차감
    if(material === 'potato') user.storage.gamja -= 1;
    if(material === 'barley') user.storage.bori -= 1;

    // products 깊은 복사 후 저장!
    let newProducts = { ...(user.products || {}) };
    newProducts[product] = (newProducts[product]||0) + 1;
    user.products = newProducts;
    user.markModified('products');

    await user.save();

    // 저장 후 실제 반영 확인용 로그(배포시 제거 가능)
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
    // [{name:제품명, count:수량}, ...]
    const list = Object.entries(counter).map(([k,v])=>({ name:k, count:v }));
    res.json({ success:true, list });
  } catch(e){
    res.json({ success:false, message:'집계 오류' });
  }
});

// 4. debug-test: 라우터 진입 체크용 임시 테스트 라우터
router.post('/debug-test', (req, res) => {
  console.log("🔥 debug-test req.body:", req.body);
  res.json({ ok: true, body: req.body });
});

module.exports = router;
