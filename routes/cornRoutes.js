// routes/cornRoutes.js
// 옥수수 농장 전용 라우터 (기존 규칙 유지)
// - CornData: mongoose 스키마 사용 (이미 존재한다고 가정)
// - User   : ../models/user가 없을 때도 동작하도록 유연 모델 fallback

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// --- Model wiring -----------------------------------------------------------
const CornData = require("../models/cornData");

// User 모델: 파일이 있으면 그대로 사용, 없으면 런타임 임시 모델( strict:false )
let User;
try {
  // 프로젝트에 user 모델이 이미 있으면 그대로 사용
  User = require("../models/user");
} catch (e) {
  const userSchema = new mongoose.Schema(
    {
      kakaoId: { type: String, index: true, required: true },
    },
    {
      // 감자쪽 필드(token, water, fertilizer, storage, isBankrupt 등) 그대로 허용
      strict: false,
      timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    }
  );
  User = mongoose.models.User || mongoose.model("User", userSchema);
  console.warn("[cornRoutes] ../models/user 없음 → 임시 User 모델 사용");
}

// --- Helpers ----------------------------------------------------------------

// 등급 계산 (심은 지 n일)
function gradeByDays(days) {
  if (days <= 4) return null;
  if (days === 5) return "A";
  if (days === 6) return "B";
  if (days === 7) return "C";
  if (days === 8) return "D";
  if (days === 9) return "E";
  return "F";
}

// 보상표
const TOKEN_REWARD = { A: 30, B: 20, C: 10, D: 5, E: 3, F: 1 };
const POPCORN_REWARD = { A: 3, B: 2, C: 1, D: 1, E: 1, F: 1 };

// 연체/대출 색상
function cornColor(cornDoc) {
  if (cornDoc?.loan?.unpaid > 0 && cornDoc?.loan?.lastInterestDate) {
    return "black";
  }
  if (cornDoc?.loan?.unpaid > 0) return "red";
  return "yellow";
}

// 안전 숫자
const N = (v, d = 0) => (v === undefined || v === null ? d : Number(v));

// --- Routes -----------------------------------------------------------------

// 심기
router.post("/plant", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc =
      (await CornData.findOne({ kakaoId })) ||
      (await CornData.create({ kakaoId }));

    if (user.isBankrupt) {
      return res.json({ success: false, message: "파산 상태입니다. 해제 후 심기 가능" });
    }

    const seeds = N(cornDoc.seeds ?? cornDoc.seed);
    if (seeds <= 0) {
      return res.json({ success: false, message: "씨앗 없음" });
    }
    if (cornDoc.seeds !== undefined) cornDoc.seeds = seeds - 1;
    else cornDoc.seed = seeds - 1;

    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];
    cornDoc.corn.push({
      plantedAt: new Date(),
      color: cornColor(cornDoc),
      harvestedAt: null,
      grade: null,
    });

    cornDoc.markModified("corn");
    await cornDoc.save();

    res.json({ success: true, message: "심기 완료", corn: cornDoc });
  } catch (e) {
    console.error("corn/plant error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// 수확
router.post("/harvest", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc =
      (await CornData.findOne({ kakaoId })) ||
      (await CornData.create({ kakaoId }));

    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];

    const now = new Date();
    const harvested = [];

    for (const item of cornDoc.corn) {
      if (item.harvestedAt) continue;
      const days =
        Math.floor((now.getTime() - new Date(item.plantedAt).getTime()) / (24 * 60 * 60 * 1000));
      const g = gradeByDays(days);
      if (!g) continue;

      item.harvestedAt = now;
      item.grade = g;
      harvested.push({ grade: g, color: item.color || cornColor(cornDoc) });
    }

    cornDoc.markModified("corn");
    await cornDoc.save();

    res.json({ success: true, harvested, corn: cornDoc });
  } catch (e) {
    console.error("corn/harvest error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// 뻥튀기
router.post("/pop", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc =
      (await CornData.findOne({ kakaoId })) ||
      (await CornData.create({ kakaoId }));

    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];

    let tokenGain = 0;
    let popcornGain = 0;

    for (const item of cornDoc.corn) {
      if (!item.harvestedAt || item._popped) continue;

      const g = item.grade || "F";
      let addToken = TOKEN_REWARD[g] || 0;
      let addPop = POPCORN_REWARD[g] || 0;

      const c = item.color || cornColor(cornDoc);
      if (c === "red" || c === "black") {
        addToken = Math.floor(addToken * 0.7);
      }

      tokenGain += addToken;
      popcornGain += addPop;

      item._popped = true;
    }

    if (tokenGain > 0) user.tokens = N(user.tokens) + tokenGain;
    if (popcornGain > 0) cornDoc.popcorn = N(cornDoc.popcorn) + popcornGain;

    cornDoc.markModified("corn");
    await user.save();
    await cornDoc.save();

    res.json({
      success: true,
      tokenGain,
      popcornGain,
      user: { tokens: user.tokens },
      corn: { popcorn: cornDoc.popcorn },
    });
  } catch (e) {
    console.error("corn/pop error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// 파산 해제
router.post("/release-bankruptcy", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc =
      (await CornData.findOne({ kakaoId })) ||
      (await CornData.create({ kakaoId }));

    const unpaid = N(cornDoc?.loan?.unpaid);
    const need = unpaid * 2;

    if (N(user.tokens) < need) {
      return res.json({ success: false, message: `토큰 부족(필요: ${need})` });
    }

    user.tokens = N(user.tokens) - need;
    user.isBankrupt = false;

    if (!cornDoc.loan) cornDoc.loan = { active: false, unpaid: 0, startDate: null };
    cornDoc.loan.unpaid = 0;
    cornDoc.loan.interest = 0;
    cornDoc.loan.lastInterestDate = new Date();

    await user.save();
    await cornDoc.save();

    res.json({ success: true, message: "파산 해제 완료", tokens: user.tokens });
  } catch (e) {
    console.error("corn/release-bankruptcy error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

// 요약 조회
router.get("/summary", async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    const cornDoc = await CornData.findOne({ kakaoId });

    if (!user || !cornDoc) {
      return res.json({
        inventory: { water: 0, fertilizer: 0 },
        wallet: { orcx: 0 },
        agri: { corn: 0 },
        food: { popcorn: 0 },
        additives: { salt: 0, sugar: 0 },
        status: "fallow",
        day: 0,
        growthPercent: 0,
      });
    }

    let day = 0;
    if (cornDoc.corn?.length) {
      const plantedAt = new Date(cornDoc.corn[0].plantedAt);
      day = Math.floor((Date.now() - plantedAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    res.json({
      inventory: {
        water: Number(user.water ?? 0),
        fertilizer: Number(user.fertilizer ?? 0),
      },
      wallet: { orcx: Number(user.tokens ?? 0) },
      agri: { corn: cornDoc.corn?.length ?? 0 },
      food: { popcorn: cornDoc.popcorn ?? 0 },
      additives: {
        salt: cornDoc.additives?.salt ?? 0,
        sugar: cornDoc.additives?.sugar ?? 0,
      },
      status: cornDoc.corn?.length ? "growing" : "fallow",
      day,
      growthPercent: cornDoc.corn?.length ? 50 : 0, // TODO: 성장 퍼센트 계산 로직 추가 가능
    });
  } catch (e) {
    console.error("corn/summary error:", e);
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
