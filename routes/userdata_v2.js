const express = require('express');
const router = express.Router();
const User = require('../models/users'); // 몽고 유저 모델 맞게

// POST /api/user/v2data
router.post('/', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "no id" });
    const user = await User.findOne({ kakaoId: id });
    if (!user) return res.json({ success: false, message: "user not found" });

    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        orcx: user.orcx ?? 0,             // <<<< 이 부분!!
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
module.exports = router;

