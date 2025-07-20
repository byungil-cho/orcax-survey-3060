router.post('/make-product', async (req, res) => {
  try {
    const { kakaoId, material, product } = req.body;
    const user = await User.findOne({ kakaoId });
    if(!user) return res.json({ success:false, message:'유저 없음' });
    if(!product || product.length < 2) return res.json({ success:false, message:'제품명 오류' });

    // 1. 감자/보리 자원 체크
    if(material === 'potato' && (user.storage?.gamja||0) < 1)
      return res.json({ success:false, message:'감자 부족!' });
    if(material === 'barley' && (user.storage?.bori||0) < 1)
      return res.json({ success:false, message:'보리 부족!' });

    // 2. 현재 보유 제품 종류(12종 제한)
    user.products = user.products || {};
    // 0개인 제품은 키에서 제거
    Object.keys(user.products).forEach(key => {
      if(user.products[key] <= 0) delete user.products[key];
    });

    const productKinds = Object.keys(user.products);

    // 3. 새 제품 생산 시 12종 이하만 허용
    if(!user.products[product] && productKinds.length >= 12){
      return res.json({ 
        success:false, 
        message:'최대 12종류까지만 보관할 수 있습니다. 기존 제품을 모두 소진하면 새로운 종류를 만들 수 있습니다!' 
      });
    }

    // 4. 자원 차감/제품 누적
    if(material === 'potato') user.storage.gamja -= 1;
    if(material === 'barley') user.storage.bori -= 1;
    user.products[product] = (user.products[product]||0) + 1;

    await user.save();
    res.json({ success:true });
  } catch(e){
    res.json({ success:false, message:'서버 오류' });
  }
});
