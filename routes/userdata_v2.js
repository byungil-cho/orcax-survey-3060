const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// 유저 모델 정의 (strict: false로 유연하게 처리)
const User = mongoose.model("users", new mongoose.Schema({}, { strict: false }));

// POST /api/user/v2data
router.post("/", async (req, res) => {
  try {
    const { id } = req.body;

    // ✅ 카카오 아이디로 유저 찾기 (핵심)
    const user = await User.findOne({ kakaoId: id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ 응답 포맷: 클라이언트(gamja-shop.html)와 호환되도록 구조화
    res.json({
      success: true,
      user: {
        nickname: user.nickname || "이름없음",
        token: user.orcx || 0,  // 토큰 필드는 orcx로 저장됨
        inventory: {
          seedPotato: user.inventory?.seedPotato || 0,
          seedBarley: user.inventory?.seedBarley || 0
        }
      }
    });
  } catch (err) {
    console.error("❌ userdata_v2.js error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
