const express = require('express');
const router = express.Router();
const User = require('../models/users');
const SeedStock = require('../models/SeedStock');

// 씨감자/씨보리 구매
router.post('/buy-seed', async (req, res) => {
  const { kakaoId, type } = req.body; // type: "seedPotato" or "seedBarley"
  const user = await User.findOne({ kakaoId });
  const adminStock = await SeedStock.findOne({ type });
  if (!user || !adminStock || adminStock.count < 1) {
    return res.json({ success: false, message: "씨앗 부족" });
  }
  user[type] = (user[type] || 0) + 1;
  adminStock.count -= 1;
  await user.save();
  await adminStock.save();
  res.json({ success: true, user, adminSeed: adminStock.count });
});

// 농사짓기(자원 소비, 성장포인트)
router.post('/farm', async (req, res) => {
  const { kakaoId, cropType } = req.body; // cropType: "seedPotato" or "seedBarley"
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });
  if ((user[cropType] || 0) < 1 || (user.water || 0) < 1 || (user.fertilizer || 0) < 1) {
    return res.json({ success: false, message: "자원 부족" });
  }
  // 자원 차감
  user[cropType] -= 1;
  user.water -= 1;
  user.fertilizer -= 1;
  // 성장포인트 증가
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  user.growth[growthField] = (user.growth[growthField] || 0) + 3; // 예: 물+거름=3포인트, 상세 로직 조정 가능
  await user.save();

  // 운영자 보관함에 씨앗 1개 증가(유저 사용분)
  const adminStock = await SeedStock.findOne({ type: cropType });
  if (adminStock) {
    adminStock.count += 1;
    await adminStock.save();
  }
  res.json({ success: true, user, adminSeed: adminStock?.count });
});

// 물/거름 단독 사용(원할 시)
router.patch('/use-water', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user || (user.water || 0) < 1) return res.json({ success: false, message: "물 부족" });
  user.water -= 1;
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  user.growth[growthField] = (user.growth[growthField] || 0) + 1;
  await user.save();
  res.json({ success: true, user });
});

router.patch('/use-fertilizer', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user || (user.fertilizer || 0) < 1) return res.json({ success: false, message: "거름 부족" });
  user.fertilizer -= 1;
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  user.growth[growthField] = (user.growth[growthField] || 0) + 2;
  await user.save();
  res.json({ success: true, user });
});

// 수확(랜덤 3,5,7개), 성장포인트 5이상 필요, 운영자 씨앗 회수
router.post('/harvest', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  const storageField = cropType === "seedPotato" ? "gamja" : "bori";
  if ((user.growth[growthField] || 0) < 5) return res.json({ success: false, message: "성장포인트 부족" });

  // 랜덤 수확 3,5,7
  const rewardArr = [3, 5, 7];
  const reward = rewardArr[Math.floor(Math.random() * rewardArr.length)];
  if (!user.storage) user.storage = {};
  user.storage[storageField] = (user.storage[storageField] || 0) + reward;
  user.growth[growthField] = 0;
  await user.save();

  // 운영자 보관함(씨앗) reward만큼 증가 (유저 → 관리자 회수)
  const adminStock = await SeedStock.findOne({ type: cropType });
  if (adminStock) {
    adminStock.count += reward;
    await adminStock.save();
  }

  res.json({ success: true, reward, storage: user.storage, adminSeed: adminStock?.count });
});

module.exports = router;
