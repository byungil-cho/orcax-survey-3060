const router = require('express').Router();
const User = require('../models/users'); // User 모델 경로

router.post('/', async (req, res) => {
  try {
    // 감자 페이지에서는 body.id로 카카오ID를 받음
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "no id" });
    const user = await User.findOne({ kakaoId: id });
    if (!user) return res.json({ success: false, message: "user not found" });

    // 감자 전용: 모든 값은 user.XXX로 평면 구조로 내려줌!
    res.json({
      success: true,
      user: {
        nickname: user.nickname ?? "",
        orcx: user.orcx ?? 0,
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0,
        potato: user.storage?.gamja ?? 0,  // 감자 창고
        bori: user.storage?.bori ?? 0      // 보리 창고 (감자 페이지에도 표기)
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
