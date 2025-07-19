const express = require('express');
const router = express.Router();

// ✅ 이미 존재하는 SeedStock 모델만 import (중복 선언 금지!)
const SeedStocks = require('../models/SeedStock');  // ★ 반드시 이 한 줄!
// ✅ 유저 모델 import
const User = require('../models/users');

// 🚩 씨앗 구매 라우터 (POST /api/seed/buy)
router.post('/buy', async (req, res) => {
  try {
    const { kakaoId, seedType } = req.body;
    if (!kakaoId || !seedType) return res.json({ success: false, message: "필수 파라미터 없음" });

    // 1. 유저 찾기
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    // 2. 씨앗 정보/가격 가져오기
    const type = seedType === "seedPotato" ? "gamja" : (seedType === "seedBarley" ? "bori" : null);
    if (!type) return res.json({ success: false, message: "잘못된 씨앗 종류" });

    const seedStock = await SeedStocks.findOne({ type });
    if (!seedStock || seedStock.stock < 1) return res.json({ success: false, message: "씨앗 재고 부족" });

    const price = seedStock.price ?? 2;
    if (user.orcx < price) return res.json({ success: false, message: "토큰 부족" });

    // 3. 실제 구매 처리
    user.orcx -= price;
    if (seedType === "seedPotato") user.seedPotato = (user.seedPotato ?? 0) + 1;
    if (seedType === "seedBarley") user.seedBarley = (user.seedBarley ?? 0) + 1;
    await user.save();

    // 4. 씨앗 재고 차감
    seedStock.stock -= 1;
    await seedStock.save();

    res.json({ success: true, message: "구매 완료", orcx: user.orcx, seedPotato: user.seedPotato, seedBarley: user.seedBarley });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
