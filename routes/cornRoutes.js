const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CornData = require("../models/cornData");
const User = require("../models/user");   // 🔥 이 줄 꼭 필요
// ... (모든 라우트 정의)

module.exports = router;

// 구매 API
router.post("/buy", async (req, res) => {
  try {
    const { kakaoId, item, amount = 1 } = req.body;
    if (!kakaoId || !item) {
      return res.status(400).json({ success: false, message: "kakaoId와 item 필요" });
    }

    const user = await User.findOne({ kakaoId });
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!user || !cornDoc) {
      return res.status(404).json({ success: false, message: "유저 없음" });
    }

    const PRICES = { seed: 2, salt: 1, sugar: 1 };
    if (!PRICES[item]) {
      return res.status(400).json({ success: false, message: "잘못된 item" });
    }

    const totalPrice = PRICES[item] * amount;
    const tokens = user.wallet?.tokens ?? user.tokens ?? 0;

    if (tokens < totalPrice) {
      return res.json({ success: false, message: "토큰 부족" });
    }

    // 토큰 차감
    if (user.wallet) user.wallet.tokens = tokens - totalPrice;
    else user.tokens = tokens - totalPrice;

    // 아이템 지급
    if (item === "seed") cornDoc.agri.seeds = (cornDoc.agri?.seeds ?? 0) + amount;
    if (item === "salt") cornDoc.agri.additives.salt = (cornDoc.agri?.additives?.salt ?? 0) + amount;
    if (item === "sugar") cornDoc.agri.additives.sugar = (cornDoc.agri?.additives?.sugar ?? 0) + amount;

    await user.save();
    await cornDoc.save();

    res.json({
      success: true,
      message: `${item} ${amount}개 구매 완료`,
      tokens: user.wallet?.tokens ?? user.tokens,
      inventory: {
        seeds: cornDoc.agri?.seeds ?? 0,
        salt: cornDoc.agri?.additives?.salt ?? 0,
        sugar: cornDoc.agri?.additives?.sugar ?? 0
      }
    });
  } catch (e) {
    console.error("corn/buy error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});
