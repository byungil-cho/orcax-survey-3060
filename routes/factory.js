const express = require('express');
const router = express.Router();
const User = require('../models/users');
const SeedStock = require('../models/SeedStock');

// 씨감자/씨보리 구매
router.post('/buy-seed', async (req, res) => { /* 생략, 위 내용 동일 */ });

// 농사짓기(자원 소비, 성장포인트)
router.post('/farm', async (req, res) => { /* 생략, 위 내용 동일 */ });

// PATCH /use-resource : 물/거름 한번에 처리
router.patch('/use-resource', async (req, res) => {
  const { kakaoId, cropType, water, fertilizer } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.json({ success: false, message: "유저 없음" });

  // 자원 부족 체크
  if ((user.water || 0) < (water || 0) || (user.fertilizer || 0) < (fertilizer || 0)) {
    return res.json({ success: false, message: "자원 부족" });
  }
  user.water -= water || 0;
  user.fertilizer -= fertilizer || 0;

  // 성장포인트: 물 *1, 거름 *2
  if (!user.growth) user.growth = {};
  const growthField = cropType === "seedPotato" ? "potato" : "barley";
  user.growth[growthField] = (user.growth[growthField] || 0) + (water || 0) * 1 + (fertilizer || 0) * 2;

  await user.save();
  res.json({ success: true, user });
});

// 물/거름 단독 사용 (기존)
router.patch('/use-water', async (req, res) => { /* 생략 */ });
router.patch('/use-fertilizer', async (req, res) => { /* 생략 */ });

// 수확(랜덤 3,5,7개), 성장포인트 5이상 필요, 운영자 씨앗 회수
router.post('/harvest', async (req, res) => { /* 생략, 위 내용 동일 */ });

module.exports = router;
