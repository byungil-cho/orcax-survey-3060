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
    console.log("✅ 구매 요청:", { kakaoId, seedType });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "사용자 없음" });

    const stock = await SeedStock.findOne({ type: seedType });
    if (!stock) return res.json({ success: false, message: "재고 없음" });

    const priceDoc = await SeedPrice.findOne();
    if (!priceDoc) return res.json({ success: false, message: "가격 정보 없음" });

    // ✅ 가격 접근 수정: 영문 필드명 사용
    const price =
      seedType === "seedPotato" ? priceDoc.potato :
      seedType === "seedBarley" ? priceDoc.barley : null;

    if (price === null || typeof price !== 'number' || isNaN(price)) {
      return res.json({ success: false, message: "가격 오류" });
    }

    // ✅ 누락 가능성 있는 필드 방어 (User 저장 실패 방지)
    if (!user.nickname) user.nickname = "무명";
    if (typeof user.orcx !== 'number' || isNaN(user.orcx)) user.orcx = 0;
    if (typeof user.seedPotato !== 'number' || isNaN(user.seedPotato)) user.seedPotato = 0;
    if (typeof user.seedBarley !== 'number' || isNaN(user.seedBarley)) user.seedBarley = 0;

    // ✅ 토큰 및 재고 체크
    if (user.orcx < price)
      return res.json({ success: false, message: "토큰 부족" });

    if (stock.quantity <= 0)
      return res.json({ success: false, message: "재고 없음" });

    // ✅ 재고 차감
    stock.quantity -= 1;
    await stock.save();

    // ✅ 씨앗 지급
    if (seedType === "seedPotato") user.seedPotato += 1;
    else if (seedType === "seedBarley") user.seedBarley += 1;

    // ✅ 토큰 차감
    user.orcx -= price;
    await user.save();

    console.log(`🎉 구매 완료: ${kakaoId} → ${seedType} 1개 차감 / 토큰 ${price} 사용`);
    res.json({ success: true, message: "구매 완료" });

  } catch (err) {
    console.error("❌ 구매 처리 중 서버 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류 발생" });
  }
});

module.exports = router;
