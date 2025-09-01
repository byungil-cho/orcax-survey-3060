const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CornData = require("../models/CornData");
const User = require("../models/user");   // 🔥 꼭 필요

// ==========================
// 구매 API
// ==========================
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
    if (item === "seed") cornDoc.seed = (cornDoc.seed ?? 0) + amount;
    if (item === "salt") cornDoc.additives.salt = (cornDoc.additives?.salt ?? 0) + amount;
    if (item === "sugar") cornDoc.additives.sugar = (cornDoc.additives?.sugar ?? 0) + amount;

    await user.save();
    await cornDoc.save();

    // ✅ DB 구조에 맞게 corn은 숫자 그대로 반환
    res.json({
      success: true,
      message: `${item} ${amount}개 구매 완료`,
      tokens: user.wallet?.tokens ?? user.tokens,
      inventory: {
        corn: cornDoc.corn ?? 0,                // 👈 옥수수 (숫자 필드 그대로)
        popcorn: cornDoc.popcorn ?? 0,          // 팝콘
        seed: cornDoc.seed ?? 0,                // 씨옥수수
        salt: cornDoc.additives?.salt ?? 0,     // 소금
        sugar: cornDoc.additives?.sugar ?? 0    // 설탕
      }
    });
  } catch (e) {
    console.error("corn/buy error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// ==========================
// 옥수수 상태 조회 API
// ==========================
router.get("/status", async (req, res) => {
  try {
    const { kakaoId } = req.query;
    const user = await User.findOne({ kakaoId });
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!user || !cornDoc) {
      return res.status(404).json({ success: false, message: "유저 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      inventory: {
        corn: cornDoc.corn ?? 0,                // 옥수수
        popcorn: cornDoc.popcorn ?? 0,          // 팝콘
        seed: cornDoc.seed ?? 0,                // 씨옥수수
        salt: cornDoc.additives?.salt ?? 0,     // 소금
        sugar: cornDoc.additives?.sugar ?? 0    // 설탕
      }
    });
  } catch (e) {
    console.error("corn/status error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
