const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  try {
    const kakaoId = req.body.kakaoId;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: "kakaoId 누락" });
    }

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        orcx_token: user.orcx_token,
        water: user.water,
        fertilizer: user.fertilizer,
        inventory: {
          seed_potato: user.inventory?.seed_potato ?? 0,
          seed_barley: user.inventory?.seed_barley ?? 0
        }
      }
    });
  } catch (err) {
    console.error("❌ /api/userdata 오류", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
