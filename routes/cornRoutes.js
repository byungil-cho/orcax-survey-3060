// routes/cornRoutes.js
const express = require('express');
const router = express.Router();
const cornEngine = require('../engine/cornEngine');
const User = require('../models/users');

// 헬퍼
async function ensureCornDoc(kakaoId) {
  let user = await User.findOne({ kakaoId });
  if (!user) {
    user = new User({ kakaoId, tokens: 0, seed: 0, salt: 0, sugar: 0, popcorn: 0, fertilizer: 0, level: 0 });
    await user.save();
  }
  return user;
}

// 씨앗 심기
router.post('/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const seedImg = cornEngine.plantSeed(user);
    user.seed -= 1;
    user.phase = 'GROW';
    user.plantedAt = new Date();
    await user.save();
    res.json({ ok: true, seedImg, phase: user.phase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 성장
router.get('/grow', async (req, res) => {
  try {
    const { kakaoId } = req.query;
    const user = await ensureCornDoc(kakaoId);
    const state = cornEngine.growStep(user, new Date());
    res.json({ ok: true, ...state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 수확
router.post('/harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const result = cornEngine.harvestCorn(user);
    user.cornCount = (user.cornCount || 0) + result.cornCount;
    await user.save();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 뻥튀기
router.post('/pop', async (req, res) => {
  try {
    const { kakaoId, grade, cornCount } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const tokens = cornEngine.popCorn(user, grade, cornCount);
    await user.save();
    res.json({ ok: true, tokens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 팝콘 ↔ 거름
router.post('/exchange', async (req, res) => {
  try {
    const { kakaoId, popcorn } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const result = cornEngine.exchangePopcorn(user, popcorn);
    await user.save();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 레벨업
router.post('/level', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const result = cornEngine.levelUp(user);
    await user.save();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 예약제
router.post('/schedule', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    const user = await ensureCornDoc(kakaoId);
    const result = cornEngine.schedulePlant(user, new Date());
    await user.save();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
