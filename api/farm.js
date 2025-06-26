const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/grow", async (req, res) => {
  const { nickname, cropType } = req.body;
  console.log("📥 요청 도착:", cropType);

  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.json({ success: false, error: "사용자 없음" });

    // 🌿 물 또는 거름은 씨감자 1개 이상 있어야 사용 가능
    if (user.seedPotato < 1) {
      return res.json({ success: false, error: "씨감자가 없으면 농사 지을 수 없습니다." });
    }

    if (cropType === "물") {
      if (user.water < 1) return res.json({ success: false, error: "물 부족" });
      user.water -= 1;
      user.growthPoint += 1;
      await user.save();
      return res.json({ success: true, message: "물 주기 완료" });
    }

    if (cropType === "거름") {
      if (user.fertilizer < 1) return res.json({ success: false, error: "거름 부족" });
      user.fertilizer -= 1;
      user.growthPoint += 1;
      await user.save();
      return res.json({ success: true, message: "거름 주기 완료" });
    }

    if (cropType === "수확") {
      if (user.seedPotato < 1) return res.json({ success: false, error: "씨감자 없음" });
      user.seedPotato -= 1;
      user.growthPoint += 1;
      await user.save();
      return res.json({ success: true, message: "수확 완료" });
    }

    return res.json({ success: false, error: "유효하지 않은 cropType" });

  } catch (err) {
    console.error("🔥 서버 오류:", err);
    return res.json({ success: false, error: "서버 오류 발생" });
  }
});

module.exports = router;
