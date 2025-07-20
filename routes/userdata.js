const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.post('/', async (req, res) => {
  try {
    // 프론트에서 body: { kakaoId }로 보내므로 반드시 kakaoId로 받을 것!
    const { kakaoId } = req.body;
    if (!kakaoId) {
      return res.json({ success: false, message: "no kakaoId" });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    // 값 변환 및 반환: 감자와 1:1 구조 동일
    res.json({
      success: true,
      user: {
        nickname: user.nickname ?? "",
        orcx: user.orcx ?? 0,
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedBarley: user.seedBarley ?? 0,
        seedPotato: user.seedPotato ?? 0,
        growth: user.growth || { potato: 0, barley: 0 },
        storage: user.storage || { gamja: 0, bori: 0 },
        // 실제 바인딩용 값
        barley: user.storage?.bori ?? 0,      // 보리 수량
        bori: user.storage?.bori ?? 0,        // 보리 수량 (별칭)
        potato: user.storage?.gamja ?? 0,     // 감자 수량 (혹시 필요하면)
      }
    });
  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
