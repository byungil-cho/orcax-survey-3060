const express = require('express');
const router = express.Router();
const User = require('../models/users');
const SeedStock = require('../models/SeedStock');

// 씨감자/씨보리 구매
router.post('/buy-seed', async (req, res) => {
  const { kakaoId, type } = req.body; // type: 'seedPotato' or 'seedBarley'
  const user = await User.findOne({ kakaoId });
  const adminStock = await SeedStock.findOne({ type });
  if (!user || !adminStock || adminStock.count < 1) {
    return res.json({ success: false, message: "씨앗 부족(관리자창고)" });
  }
  user[type] = (user[type] || 0) + 1;
  adminStock.count -= 1;
  await user.save();
  await adminStock.save();
  res.json({ success: true, user, adminSeed: adminStock.count });
});

// PATCH /use-resource : 물, 거름 한 번에 처리(사업용)
router.patch('/use-resource', async (req, res) => {
  const { kakaoId, cropType, water, fertilizer } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });

  // 물/거름 소모량(무조건 양수) 처리
  const waterUsed = Math.abs(water || 0);
  const fertUsed = Math.abs(fertilizer || 0);

  // 자원 부족 체크
  if ((user.water || 0) < waterUsed || (user.fertilizer || 0) < fertUsed) {
    return res.json({ success: false, message: "자원 부족" });
  }

  // 자원 차감(0 미만 방지)
  user.water = Math.max((user.water || 0) - waterUsed, 0);
  user.fertilizer = Math.max((user.fertilizer || 0) - fertUsed, 0);

  // 성장포인트 누적(물 1 → +1, 거름 1 → +2)
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  user.growth[growthField] = (user.growth[growthField] || 0) + waterUsed * 1 + fertUsed * 2;

  await user.save();
  res.json({ success: true, user });
});

// 농사짓기(씨감자/씨보리 소모 +1, 운영자 창고 회수 +1)
router.post('/farm', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });
  if ((user[cropType] || 0) < 1) return res.json({ success: false, message: "씨앗 없음" });
  user[cropType] -= 1;
  // 운영자 창고 회수
  const adminStock = await SeedStock.findOne({ type: cropType });
  if (adminStock) {
    adminStock.count += 1;
    await adminStock.save();
  }
  await user.save();
  res.json({ success: true, user, adminSeed: adminStock?.count });
});

// ===[★ 여기서부터 수확(수정완료)]===
router.post('/harvest', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  const storageField = cropType === "seedPotato" ? "gamja" : "bori";

  // 1. 성장포인트 체크
  if ((user.growth[growthField] || 0) < 5)
    return res.json({ success: false, message: "성장포인트 부족" });

  // 2. 씨앗 존재 체크 및 차감
  if ((user[cropType] || 0) < 1)
    return res.json({ success: false, message: "씨앗이 없습니다" });
  user[cropType] -= 1;

  // 3. 관리자 씨앗 창고 +1 (회수)
  const adminStock = await SeedStock.findOne({ type: cropType });
  if (adminStock) {
    adminStock.count += 1;
    await adminStock.save();
  }

  // 4. 수확 보상 (랜덤 3,5,7개)
  const rewardArr = [3, 5, 7];
  const reward = rewardArr[Math.floor(Math.random() * rewardArr.length)];
  if (!user.storage) user.storage = {};
  user.storage[storageField] = (user.storage[storageField] || 0) + reward;

  // 5. 성장포인트 초기화
  user.growth[growthField] = 0;

  await user.save();
  res.json({
    success: true,
    reward,
    storage: user.storage,
    adminSeed: adminStock?.count,
    userSeed: user[cropType], // 현재 씨앗 잔량
  });
});

module.exports = router;
