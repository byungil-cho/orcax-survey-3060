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
        token: user.wallet.orcx ?? 0,
        inventory: user.inventory ?? {},
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
module.exports = router;
