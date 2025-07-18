const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SeedStock = require("../models/SeedStock");

router.post("/", async (req, res) => {
  const { kakaoId, seedType } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "사용자 없음" });

    // type 매핑
    const stock = await SeedStock.findOne({ seedType: seedType === "seedPotato" ? "gamja" : "bori" });
    if (!stock || stock.quantity <= 0) return res.json({ success: false, message: "재고 없음" });

    const price = stock.price ?? 1;
    if (user.orcx < price) return res.json({ success: false, message: "토큰 부족" });

    // 재고 감소
    stock.quantity -= 1;
    await stock.save();

    // 유저 씨앗 증가
    if (seedType === "seedPotato") user.seedPotato += 1;
    else user.seedBarley += 1;

    user.orcx -= price;
    await user.save();

    res.json({ success: true, message: "구매 완료" });

  } catch (err) {
    console.error("구매 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
