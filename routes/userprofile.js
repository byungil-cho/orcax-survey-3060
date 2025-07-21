// routes/userprofile.js (예시)
const express = require("express");
const router = express.Router();
const User = require("../models/users");

router.get("/profile/:nickname", async (req, res) => {
  const { nickname } = req.params;
  if (!nickname) return res.status(400).json({ error: "닉네임 필요" });
  const user = await User.findOne({ nickname });
  if (!user) return res.status(404).json({ error: "유저 없음" });

  res.json({
    nickname: user.nickname,
    kakaoId: user.kakaoId,
    farmName: user.farmName,
    level: user.level || 1,
    grade: user.grade || "초급",
    orcx: user.orcx || 0,
    water: user.water || 0,
    fertilizer: user.fertilizer || 0,
    seedPotato: user.seedPotato || 0,
    seedBarley: user.seedBarley || 0,
    potato: user.storage?.gamja || 0,
    barley: user.storage?.bori || 0,
    products: user.products || {},
    lastLogin: user.lastLogin,
    // 기타 필요한 정보 계속 추가 가능
  });
});

module.exports = router;
