const router = require('express').Router(); // <-- 이 한줄 꼭 필요!
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
