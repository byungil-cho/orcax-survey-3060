const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CornData = require("../models/cornData");
const User = require("../models/user");

// =======================
// 씨앗 심기
// =======================
router.post("/plant", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc = (await CornData.findOne({ kakaoId })) || (await CornData.create({ kakaoId, agri: { seeds: 0, corn: 0, popcorn: 0, additives: { salt: 0, sugar: 0 } } }));

    if ((cornDoc.agri?.seeds ?? 0) <= 0) {
      return res.json({ success: false, message: "씨옥수수 없음" });
    }

    cornDoc.agri.seeds -= 1;
    cornDoc.agri.corn = (cornDoc.agri.corn ?? 0) + 1;

    await cornDoc.save();

    res.json({ success: true, message: "심기 완료", corn: cornDoc.agri.corn, seeds: cornDoc.agri.seeds });
  } catch (e) {
    console.error("corn/plant error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// =======================
// 수확
// =======================
router.post("/harvest", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!cornDoc) return res.status(404).json({ success: false, message: "corn 데이터 없음" });

    const harvested = cornDoc.agri?.corn ?? 0;
    cornDoc.agri.corn = 0;

    await cornDoc.save();

    res.json({ success: true, harvested, corn: cornDoc.agri.corn });
  } catch (e) {
    console.error("corn/harvest error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// =======================
// 뻥튀기 (팝콘 생산)
// =======================
router.post("/pop", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!cornDoc) return res.status(404).json({ success: false, message: "corn 데이터 없음" });

    const corn = cornDoc.agri?.corn ?? 0;
    if (corn <= 0) return res.json({ success: false, message: "옥수수 없음" });

    cornDoc.agri.corn -= 1;
    cornDoc.agri.popcorn = (cornDoc.agri?.popcorn ?? 0) + 1;

    await cornDoc.save();

    res.json({ success: true, popcorn: cornDoc.agri.popcorn, corn: cornDoc.agri.corn });
  } catch (e) {
    console.error("corn/pop error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// =======================
// 파산 해제
// =======================
router.post("/release-bankruptcy", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    user.isBankrupt = false;
    await user.save();

    res.json({ success: true, message: "파산 해제 완료" });
  } catch (e) {
    console.error("corn/release-bankruptcy error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// =======================
// 구매 API (씨옥수수, 소금, 설탕)
// =======================
router.post("/buy", async (req, res) => {
  try {
    const { kakaoId, item, amount = 1 } = req.body;
    if (!kakaoId || !item) {
      return res.status(400).json({ success: false, message: "kakaoId와 item 필요" });
    }

    const user = await User.findOne({ kakaoId });
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!user || !cornDoc) return res.status(404).json({ success: false, message: "유저/옥수수 데이터 없음" });

    const PRICES = { seed: 2, salt: 1, sugar: 1 };
    if (!PRICES[item]) return res.status(400).json({ success: false, message: "잘못된 item" });

    const tokens = user.wallet?.tokens ?? user.tokens ?? 0;
    const totalPrice = PRICES[item] * amount;

    if (tokens < totalPrice) return res.json({ success: false, message: "토큰 부족" });

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

// =======================
// 요약 조회 API (옥수수, 씨앗, 소금, 설탕, 팝콘)
// =======================
router.get("/summary", async (req, res) => {
  try {
    const { kakaoId } = req.query;
    const cornDoc = await CornData.findOne({ kakaoId });
    if (!cornDoc) {
      return res.json({ seeds: 0, corn: 0, salt: 0, sugar: 0, popcorn: 0 });
    }

    res.json({
      seeds: cornDoc.agri?.seeds ?? 0,
      corn: cornDoc.agri?.corn ?? 0,
      salt: cornDoc.agri?.additives?.salt ?? 0,
      sugar: cornDoc.agri?.additives?.sugar ?? 0,
      popcorn: cornDoc.agri?.popcorn ?? 0
    });
  } catch (e) {
    console.error("corn/summary error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// =======================
module.exports = router;
