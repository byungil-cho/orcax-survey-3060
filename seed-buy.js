const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SeedStock = require("../models/SeedStock");
const SeedPrice = require("../models/SeedPrice");

router.post("/", async (req, res) => {
  const { id, type } = req.body;
  const kakaoId = id;
  const seedType = type;

  try {
    console.log("✅ 구매 요청 들어옴:", { kakaoId, seedType });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "사용자 없음" });

    const stock = await SeedStock.findOne({ type: seedType });
    if (!stock) return res.json({ success: false, message: "재고 데이터 없음" });

    const priceDoc = await SeedPrice.findOne();
    if (!priceDoc) return res.json({ success: false, message: "가격 정보 없음" });

    const price =
      seedType === "seedPotato" ? priceDoc.감자 :
      seedType === "seedBarley" ? priceDoc.보리 : null;

    if (price === null)
      return res.json({ success: false, message: "유효하지 않은 씨앗 유형" });

    if (stock.quantity <= 0)
      return res.json({ success: false, message: "재고 없음" });

    if (typeof user.orcx !== 'number') user.orcx = 0;
    if (user.orcx < price)
      return res.json({ success: false, message: "토큰 부족" });

    // 안전 초기화
    if (typeof user.seedPotato !== 'number') user.seedPotato = 0;
    if (typeof user.seedBarley !== 'number') user.seedBarley = 0;

    // 씨앗 재고 감소
    stock.quantity -= 1;
    await stock.save();

    // 유저 인벤토리 증가
    if (seedType === "seedPotato") user.seedPotato += 1;
    else if (seedType === "seedBarley") user.seedBarley += 1;

    // 토큰 차감
    user.orcx -= price;
    await user.save();

    console.log(`🎉 ${kakaoId} 님의 ${seedType} 구매 완료`);

    res.json({ success: true, message: "구매 완료" });

  } catch (err) {
    console.error("❌ 구매 처리 중 서버 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류 발생" });
  }
});

module.exports = router;
