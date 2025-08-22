const express = require("express");
const router = express.Router();
const CornData = require("../models/cornData");
const User = require("../models/user");

// 👉 매일 이자 자동 정산 함수
async function applyDailyInterest(cornUser, user) {
  const today = new Date().toISOString().split("T")[0];
  if (cornUser.loan.lastInterestDate === today) return;

  if (cornUser.loan.unpaid > 0) {
    const interest = Math.floor(cornUser.loan.unpaid * 0.05);

    if (user.token >= interest) {
      user.token -= interest;
      cornUser.loan.interest += interest;
    } else {
      // 파산 처리
      user.isBankrupt = true;
    }
  }

  cornUser.loan.lastInterestDate = today;
  await cornUser.save();
  await user.save();
}


// 📌 옥수수 심기
router.post("/plant", async (req, res) => {
  try {
    const { kakaoId, count, isLoan } = req.body;

    let cornUser = await CornData.findOne({ kakaoId });
    let user = await User.findOne({ kakaoId });

    if (!cornUser) cornUser = new CornData({ kakaoId });
    if (!user) return res.status(404).json({ success: false, message: "유저 없음" });

    // 👉 파산자는 농장 입장 금지
    if (user.isBankrupt) {
      return res.status(403).json({ success: false, message: "파산 상태입니다. 입장 불가" });
    }

    // 👉 연체 상태면 씨앗은 자동 "black"
    let color = "yellow";
    if (isLoan) color = "red";
    if (cornUser.loan.unpaid > 0) color = "black";

    for (let i = 0; i < count; i++) {
      cornUser.corn.push({
        color,
        plantedAt: new Date()
      });
    }

    cornUser.seed -= count;
    await cornUser.save();

    res.json({ success: true, corn: cornUser.corn });
  } catch (err) {
    console.error("옥수수 심기 오류:", err);
    res.status(500).json({ success: false, message: "심기 실패" });
  }
});


// 📌 옥수수 수확 (등급 판정)
router.post("/harvest", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const cornUser = await CornData.findOne({ kakaoId });
    const user = await User.findOne({ kakaoId });

    if (!cornUser || !user) return res.status(404).json({ success: false });

    await applyDailyInterest(cornUser, user);

    let harvested = [];
    cornUser.corn = cornUser.corn.map(c => {
      if (!c.harvestedAt) {
        const days = Math.floor((Date.now() - c.plantedAt) / (1000 * 60 * 60 * 24));
        if (days === 5) c.grade = "A";
        else if (days === 6) c.grade = "B";
        else if (days === 7) c.grade = "C";
        else if (days === 8) c.grade = "D";
        else if (days === 9) c.grade = "E";
        else if (days >= 10) c.grade = "F";
        else c.grade = "F";

        c.harvestedAt = new Date();
        harvested.push(c);
      }
      return c;
    });

    await cornUser.save();
    res.json({ success: true, harvested });
  } catch (err) {
    console.error("수확 오류:", err);
    res.status(500).json({ success: false, message: "수확 실패" });
  }
});


// 📌 옥수수 뻥튀기
router.post("/pop", async (req, res) => {
  try {
    const { kakaoId, cornIndex } = req.body;
    const cornUser = await CornData.findOne({ kakaoId });
    const user = await User.findOne({ kakaoId });

    if (!cornUser || !user) return res.status(404).json({ success: false });
    if (user.isBankrupt) return res.status(403).json({ success: false, message: "파산 상태" });

    await applyDailyInterest(cornUser, user);

    const corn = cornUser.corn[cornIndex];
    if (!corn || !corn.harvestedAt) return res.status(400).json({ success: false });

    const harvestCounts = [5, 7, 9];
    const count = harvestCounts[Math.floor(Math.random() * harvestCounts.length)];

    let tokenReward = 0;
    if (corn.grade === "A") tokenReward = count === 5 ? 3700 : count === 7 ? 5200 : 6200;
    else if (corn.grade === "B") tokenReward = count === 5 ? 2900 : count === 7 ? 4100 : 5000;
    else if (corn.grade === "C") tokenReward = count === 5 ? 2100 : count === 7 ? 3000 : 3700;
    else if (corn.grade === "D") tokenReward = count === 5 ? 1300 : count === 7 ? 1900 : 2400;
    else if (corn.grade === "E") tokenReward = count === 5 ? 550 : count === 7 ? 550 : 750;
    else if (corn.grade === "F") tokenReward = count === 5 ? 260 : count === 7 ? 280 : 370;

    const popcornReward = count === 9 ? 2 : 1;

    // 👉 빨강/검정은 30% 삭감
    if (corn.color === "red" || corn.color === "black") {
      const deducted = Math.floor(tokenReward * 0.3);
      tokenReward -= deducted;
      cornUser.loan.interest += deducted;
    }

    cornUser.popcorn += popcornReward;
    user.token += tokenReward;

    await cornUser.save();
    await user.save();

    res.json({
      success: true,
      grade: corn.grade,
      color: corn.color,
      tokenReward,
      popcornReward,
      totalPopcorn: cornUser.popcorn,
      totalToken: user.token,
      loan: cornUser.loan
    });
  } catch (err) {
    console.error("뻥튀기 오류:", err);
    res.status(500).json({ success: false, message: "뻥튀기 실패" });
  }
});


// 📌 파산 해제
router.post("/release-bankruptcy", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const cornUser = await CornData.findOne({ kakaoId });
    const user = await User.findOne({ kakaoId });

    if (!cornUser || !user) return res.status(404).json({ success: false });

    const required = cornUser.loan.unpaid * 2;
    if (user.token >= required) {
      user.token -= required;
      user.isBankrupt = false;
      cornUser.loan.unpaid = 0;
      cornUser.loan.interest = 0;
      await cornUser.save();
      await user.save();
      res.json({ success: true, message: "파산 해제 완료" });
    } else {
      res.json({ success: false, message: "토큰 부족" });
    }
  } catch (err) {
    console.error("파산 해제 오류:", err);
    res.status(500).json({ success: false, message: "파산 해제 실패" });
  }
});

module.exports = router;
