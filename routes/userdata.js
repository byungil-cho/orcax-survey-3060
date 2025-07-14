const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  const { kakaoId } = req.body;

  try {
    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.json({ success: false, message: "사용자 없음" });
    }

    // 통합 구조로 응답 변환
    const formattedUser = {
      nickname: user.nickname ?? "",
      kakaoId: user.kakaoId ?? "",
      email: user.email ?? "",
      inventory: {
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0
      },
      wallet: {
        orcx: user.orcx ?? 0
      },
      storage: {
        gamja: user.potato ?? 0,
        bori: user.bori ?? 0
      }
    };

    res.json({ success: true, user: formattedUser });

  } catch (err) {
    console.error("유저 데이터 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

module.exports = router;
