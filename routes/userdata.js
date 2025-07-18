const express = require("express");
const router = express.Router();
const User = require("../models/users");

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
        water: user.water ?? 0,
        fertilizer: user.fertilizer ?? 0,
        seedPotato: user.seedPotato ?? 0,
        seedBarley: user.seedBarley ?? 0
      },
      wallet: {
        orcx: user.orcx ?? 0
      },
      potato: user.storage?.gamja ?? 0,   // 감자
      barley: user.storage?.bori ?? 0     // 보리
    };

    console.log("👉 보낼 유저 데이터:", formattedUser);

    res.json({ success: true, user: formattedUser });

  } catch (err) {
    console.error("❌ 유저 데이터 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

document.getElementById("potato").textContent = user.potato || 0;

