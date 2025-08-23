// routes/cornRoutes.js
// 옥수수 농장 전용 라우터 (수정본)
// - corn 배열은 그대로 저장하지만, 응답은 count(숫자)로 내려서 [object Object] 문제 제거

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CornData = require("../models/cornData");

// User 모델 안전 로딩
let User;
try {
  User = require("../models/user");
} catch (e) {
  const userSchema = new mongoose.Schema(
    { kakaoId: { type: String, index: true, required: true } },
    { strict: false, timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
  );
  User = mongoose.models.User || mongoose.model("User", userSchema);
  console.warn("[cornRoutes] ../models/user 없음 → 임시 User 모델 사용");
}

// ---------------- Helpers ----------------
function gradeByDays(days) {
  if (days <= 4) return null;
  if (days === 5) return "A";
  if (days === 6) return "B";
  if (days === 7) return "C";
  if (days === 8) return "D";
  if (days === 9) return "E";
  return "F";
}

const TOKEN_REWARD = { A: 30, B: 20, C: 10, D: 5, E: 3, F: 1 };
const POPCORN_REWARD = { A: 3, B: 2, C: 1, D: 1, E: 1, F: 1 };

function cornColor(cornDoc) {
  if (cornDoc?.loan?.unpaid > 0 && cornDoc?.loan?.lastInterestDate) return "black";
  if (cornDoc?.loan?.unpaid > 0) return "red";
  return "yellow";
}

async function applyDailyInterest(user, cornDoc) {
  if (!cornDoc.loan) cornDoc.loan = { active: false, unpaid: 0, startDate: null };
  const loan = cornDoc.loan;

  if (!loan.unpaid || loan.unpaid <= 0) return { changed: false };

  const now = new Date();
  const last = loan.lastInterestDate ? new Date(loan.lastInterestDate) : null;
  if (last && last.toDateString() === now.toDateString()) return { changed: false };

  const interest = Math.floor(loan.unpaid * 0.05);
  const need = interest;

  const tokens = Number(user.tokens || 0);
  if (tokens >= need) {
    user.tokens = tokens - need;
    loan.unpaid = (loan.unpaid || 0) + interest;
    loan.lastInterestDate = now;
    await user.save();
    await cornDoc.save();
    return { changed: true, bankrupt: false, interest };
  }

  user.isBankrupt = true;
  loan.lastInterestDate = now;
  await user.save();
  await cornDoc.save();
  return { changed: true, bankrupt: true, interest };
}

const N = (v, d = 0) => (v === undefined || v === null ? d : Number(v));

// ---------------- Routes ----------------

// 씨앗 심기
router.post("/plant", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc = (await CornData.findOne({ kakaoId })) || (await CornData.create({ kakaoId }));

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

    res.json({
      success: true,
      message: "심기 완료",
      corn: { count: cornDoc.corn.length }, // ✅ 배열 대신 개수만
      seeds: cornDoc.seeds ?? cornDoc.seed ?? 0,
    });
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

    const cornDoc = (await CornData.findOne({ kakaoId })) || (await CornData.create({ kakaoId }));
    await applyDailyInterest(user, cornDoc);

    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];

    const now = new Date();
    const harvested = [];

    for (const item of cornDoc.corn) {
      if (item.harvestedAt) continue;
      const days = Math.floor((now - new Date(item.plantedAt)) / (24 * 60 * 60 * 1000));
      const g = gradeByDays(days);
      if (!g) continue;

      item.harvestedAt = now;
      item.grade = g;
      harvested.push({ grade: g, color: item.color || cornColor(cornDoc) });
    }

    cornDoc.markModified("corn");
    await cornDoc.save();

    res.json({
      success: true,
      harvested,
      corn: { count: cornDoc.corn.length }, // ✅ 개수만
    });
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

    const cornDoc = (await CornData.findOne({ kakaoId })) || (await CornData.create({ kakaoId }));
    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];

    let tokenGain = 0;
    let popcornGain = 0;

    for (const item of cornDoc.corn) {
      if (!item.harvestedAt || item._popped) continue;

      const g = item.grade || "F";
      let addToken = TOKEN_REWARD[g] || 0;
      let addPop = POPCORN_REWARD[g] || 0;

      const c = item.color || cornColor(cornDoc);
      if (c === "red" || c === "black") addToken = Math.floor(addToken * 0.7);

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
      corn: { popcorn: cornDoc.popcorn, count: cornDoc.corn.length }, // ✅ 개수 포함
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

    const cornDoc = (await CornData.findOne({ kakaoId })) || (await CornData.create({ kakaoId }));

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

module.exports = router;
