// routes/processing.js
const express = require('express');
const router = express.Router();
const User = require('../models/users');

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

// 2. 가공공장: 띄어쓰기 포함 제품명 차단 + 안내문구!
router.post('/make-product', async (req, res) => {
  try {
    const { kakaoId, material, product } = req.body;
    const user = await User.findOne({ kakaoId });
    if(!user) return res.json({ success:false, message:'유저 없음' });

    const name = (product || '').trim();
    if(!name || name.length < 2)
      return res.json({ success:false, message:'제품명은 2자 이상 입력하세요.' });

    // 🚩띄어쓰기 있으면 안내만 하고 중단!
    if (name.includes(' ')) {
      return res.json({ success: false, message: '띄어쓰기 없이 입력하세요!' });
    }

    // 감자/보리 자원 체크
    if(material === 'potato' && (user.storage?.gamja||0)<1)
      return res.json({ success:false, message:'감자 부족!' });
    if(material === 'barley' && (user.storage?.bori||0)<1)
      return res.json({ success:false, message:'보리 부족!' });

    // 자원 차감
    if(material === 'potato') user.storage.gamja -= 1;
    if(material === 'barley') user.storage.bori -= 1;

    // 제품 누적 (Object 깊은 복사)
    let newProducts = { ...(user.products || {}) };
    newProducts[name] = (newProducts[name]||0) + 1;
    user.products = newProducts;
    user.markModified('products');
    await user.save();

    res.json({ success:true });
  } catch(e){
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

module.exports = router;
