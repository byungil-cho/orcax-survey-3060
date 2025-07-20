const express = require('express');
const router = express.Router();
const User = require('../models/users');
const SeedStock = require('../models/SeedStock');

// 서버 내부에서 cropType(프론트/로직) → DB type("gamja"/"bori")로 변환 함수
function getDbSeedType(type) {
  if (type === "seedPotato" || type === "gamja") return "gamja";
  if (type === "seedBarley" || type === "bori") return "bori";
  return type;
}

// 씨감자/씨보리 구매
router.post('/buy-seed', async (req, res) => {
  const { kakaoId, type } = req.body; // type: 'seedPotato' or 'seedBarley'
  const user = await User.findOne({ kakaoId });
  const dbType = getDbSeedType(type);
  const adminStock = await SeedStock.findOne({ type: dbType });
  if (!user || !adminStock || adminStock.stock < 1) {
    return res.json({ success: false, message: "씨앗 부족(관리자창고)" });
  }
  user[type] = (user[type] || 0) + 1;
  adminStock.stock -= 1;
  await user.save();
  await adminStock.save();
  res.json({ success: true, user, adminSeed: adminStock.stock });
});

// PATCH /use-resource : 물, 거름 한 번에 처리(사업용)
router.patch('/use-resource', async (req, res) => {
  const { kakaoId, cropType, water, fertilizer } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });

  const waterUsed = Math.abs(water || 0);
  const fertUsed = Math.abs(fertilizer || 0);

  if ((user.water || 0) < waterUsed || (user.fertilizer || 0) < fertUsed) {
    return res.json({ success: false, message: "자원 부족" });
  }

  user.water = Math.max((user.water || 0) - waterUsed, 0);
  user.fertilizer = Math.max((user.fertilizer || 0) - fertUsed, 0);

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

  // 운영자 창고 회수 (DB 타입 매핑 필수!)
  const dbType = getDbSeedType(cropType);
  const adminStock = await SeedStock.findOne({ type: dbType });
  if (adminStock) {
    adminStock.stock += 1;
    await adminStock.save();
  }
  await user.save();
  res.json({ success: true, user, adminSeed: adminStock?.stock });
});

// ===[★ 수확도 동일하게 type 매핑!]===
router.post('/harvest', async (req, res) => {
  const { kakaoId, cropType } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  const storageField = cropType === "seedPotato" ? "gamja" : "bori";

  if ((user.growth[growthField] || 0) < 5)
    return res.json({ success: false, message: "성장포인트 부족" });

  if ((user[cropType] || 0) < 1)
    return res.json({ success: false, message: "씨앗이 없습니다" });
  user[cropType] -= 1;

  // 관리자 씨앗 창고 +1 (DB 타입 매핑 필수!)
  const dbType = getDbSeedType(cropType);
  const adminStock = await SeedStock.findOne({ type: dbType });
  if (adminStock) {
    adminStock.stock += 1;
    await adminStock.save();
  }

  const rewardArr = [3, 5, 7];
  const reward = rewardArr[Math.floor(Math.random() * rewardArr.length)];
  if (!user.storage) user.storage = {};
  user.storage[storageField] = (user.storage[storageField] || 0) + reward;

  user.growth[growthField] = 0;

  await user.save();
  res.json({
    success: true,
    reward,
    storage: user.storage,
    adminSeed: adminStock?.stock,
    userSeed: user[cropType],
  });
});

module.exports = router;
