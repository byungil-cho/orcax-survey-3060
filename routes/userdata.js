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

    const formattedUser = {
      nickname: user.nickname ?? "",
      kakaoId: user.kakaoId ?? "",
      inventory: {
        water: user["물"] ?? 0,
        fertilizer: user["거름"] ?? 0,
        seedPotato: user["씨앗감자"] ?? user["씨감자"] ?? 0,
        seedBarley: user["씨앗보리"] ?? user["씨보리"] ?? 0
      },
      wallet: {
        orcx: user.orcx ?? 0
      },
      storage: {
        gamja: user["감자"] ?? 0,
        bori: user["보리"] ?? 0
      }
    };

    console.log("👉 보낼 유저 데이터:", formattedUser);
    res.json({ success: true, user: formattedUser });

  } catch (err) {
    console.error("유저 데이터 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

module.exports = router;
