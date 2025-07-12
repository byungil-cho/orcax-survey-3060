const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  const { kakaoId } = req.body;
  try {
    if (!kakaoId) {
      return res.status(400).json({ success: false, message: "카카오 ID 누락" });
    }

    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      orcxToken: user.orcxToken,
      inventory: user.inventory,
    });
  } catch (err) {
    console.error("유저 데이터 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

module.exports = router;
