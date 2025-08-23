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
  // 5:A, 6:B, 7:C, 8:D, 9:E, 10+ : F
  if (days <= 4) return null; // 아직 수확 불가
  if (days === 5) return "A";
  if (days === 6) return "B";
  if (days === 7) return "C";
  if (days === 8) return "D";
  if (days === 9) return "E";
  return "F";
}

// 보상표 (등급→토큰, 팝콘 수량)
const TOKEN_REWARD = { A: 30, B: 20, C: 10, D: 5, E: 3, F: 1 };
const POPCORN_REWARD = { A: 3, B: 2, C: 1, D: 1, E: 1, F: 1 };

// 연체/대출 색상
function cornColor(cornDoc) {
  if (cornDoc?.loan?.unpaid > 0 && cornDoc?.loan?.lastInterestDate) {
    // 연체 존재 → 검정
    return "black";
  }
  if (cornDoc?.loan?.unpaid > 0) return "red"; // 대출 중
  return "yellow"; // 정상
}

// 하루 이자 정산(5%/일). 토큰에서 차감, 부족하면 파산 처리.
async function applyDailyInterest(user, cornDoc) {
  if (!cornDoc.loan) cornDoc.loan = { active: false, unpaid: 0, startDate: null };
  const loan = cornDoc.loan;

  if (!loan.unpaid || loan.unpaid <= 0) return { changed: false };

  const now = new Date();
  const last = loan.lastInterestDate ? new Date(loan.lastInterestDate) : null;

  // 이미 오늘 계산했다면 스킵
  if (last && last.toDateString() === now.toDateString()) {
    return { changed: false };
  }

  // 단순히 "오늘 1회"만 계산 (복잡한 여러 일자 경과는 생략)
  const interest = Math.floor(loan.unpaid * 0.05); // 5%
  const need = interest;

  // 사용자 토큰 차감
  const tokens = Number(user.tokens || 0);
  if (tokens >= need) {
    user.tokens = tokens - need;
    loan.unpaid = (loan.unpaid || 0) + interest;
    loan.lastInterestDate = now;
    await user.save();
    await cornDoc.save();
    return { changed: true, bankrupt: false, interest };
  }

  // 토큰 부족 → 파산
  user.isBankrupt = true;
  loan.lastInterestDate = now;
  await user.save();
  await cornDoc.save();
  return { changed: true, bankrupt: true, interest };
}

// 안전 숫자
const N = (v, d = 0) => (v === undefined || v === null ? d : Number(v));

// --- Routes -----------------------------------------------------------------

// 심기
// POST /api/corn/plant  { kakaoId }
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

    // 씨앗 차감 (seed 또는 seeds 어느 필드든 고려)
    const seeds = N(cornDoc.seeds ?? cornDoc.seed);
    if (seeds <= 0) {
      return res.json({ success: false, message: "씨앗 없음" });
    }
    if (cornDoc.seeds !== undefined) cornDoc.seeds = seeds - 1;
    else cornDoc.seed = seeds - 1;

    // corn 배열에 심은 기록 추가
    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];
    cornDoc.corn.push({
      plantedAt: new Date(),
      color: cornColor(cornDoc), // red / black / yellow
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
// POST /api/corn/harvest { kakaoId }
router.post("/harvest", async (req, res) => {
  try {
    const kakaoId = req.body?.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "user 없음" });

    const cornDoc =
      (await CornData.findOne({ kakaoId })) ||
      (await CornData.create({ kakaoId }));

    // 수확 전 이자 계산
    await applyDailyInterest(user, cornDoc);

    if (!Array.isArray(cornDoc.corn)) cornDoc.corn = [];

    const now = new Date();
    const harvested = [];

    for (const item of cornDoc.corn) {
      if (item.harvestedAt) continue; // 이미 수확
      const days =
        Math.floor((now.getTime() - new Date(item.plantedAt).getTime()) / (24 * 60 * 60 * 1000));
      const g = gradeByDays(days);
      if (!g) continue; // 아직 수확 불가

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

// 뻥튀기 (등급 보상 + 팝콘/토큰 증가)
// POST /api/corn/pop  { kakaoId }
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

    // 수확된 것만 보상
    for (const item of cornDoc.corn) {
      if (!item.harvestedAt || item._popped) continue;

      const g = item.grade || "F";
      let addToken = TOKEN_REWARD[g] || 0;
      let addPop = POPCORN_REWARD[g] || 0;

      const c = item.color || cornColor(cornDoc);
      // 대출/연체 색이면 30% 삭감
      if (c === "red" || c === "black") {
        addToken = Math.floor(addToken * 0.7);
      }

      tokenGain += addToken;
      popcornGain += addPop;

      item._popped = true; // 중복 방지
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
// POST /api/corn/release-bankruptcy  { kakaoId }
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
    const need = unpaid * 2; // 문서 규칙: 미상환*2

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
