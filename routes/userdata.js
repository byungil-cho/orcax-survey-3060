const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  const { kakaoId } = req.body;

  try {
    if (!kakaoId) {
      return res.status(400).json({ success: false, message: "카카오 ID 없음" });
    }

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: "유저 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname || "닉네임 없음",
      orcxToken: user.orcx || 0,
      inventory: {
        seedPotato: user.seedPotato || 0,
        seedBarley: user.seedBarley || 0
      }
    });

  } catch (err) {
    console.error("유저 데이터 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

module.exports = router;
