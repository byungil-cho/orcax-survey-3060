const router = require('express').Router();
const User = require('../models/users');

router.post('/', async (req, res) => {
  try {
    console.log("받은 body:", req.body);   // 디버그용
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "no id" });
    const user = await User.findOne({ kakaoId: id });
    if (!user) return res.json({ success: false, message: "user not found" });

    res.json({
      success: true,
      user: {
        nickname: user.nickname ?? "",
        orcx: user.orcx ?? 0,
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0,
        // 🌱 성장포인트 전체 포함!
        growth: user.growth || { potato: 0, barley: 0 },
        // 🌱 보관함 전체 포함!
        storage: user.storage || { gamja: 0, bori: 0 },
        // 혹시 기존 프론트에서 potato, bori 키로 불러오면 이 값도 그대로 남겨둠
        potato: user.storage?.gamja ?? 0,
        bori: user.storage?.bori ?? 0
      }
    });
  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
