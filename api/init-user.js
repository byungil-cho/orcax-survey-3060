// api/init-user.js
const express = require('express');
const router = express.Router();

async function upsertAll(kakaoId, nickname = '') {
  let user = await User.findOne({ kakaoId });

// 여기에 실제 DB 모델 import (예: User, CornData)
// const User = require('../models/User');
// const CornData = require('../models/CornData');

// 통합 upsert 함수
async function upsertAll(kakaoId, nickname = '') {
  // TODO: 실제 모델 로직 채워넣기
  // const user = await User.findOneAndUpdate(...);
  // const corn = await CornData.findOneAndUpdate(...);
  return { kakaoId, nickname, ok: true };
}

// GET /api/init-user
router.get('/api/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.query || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const result = await upsertAll(kakaoId, nickname);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[GET /api/init-user] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
  // --- users ---
  const userDoc = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        email: `user-${kakaoId}@noemail.local`,
        water: 10,
        fertilizer: 10,
        orcx: 0,
        seedPotato: 0,
        seedBarley: 0,
        'growth.potato': 0,
        'growth.barley': 0,
        'storage.gamja': 0,
        'storage.bori': 0,
        createdAt: new Date()
      },
      ...(nickname ? { $set: { nickname } } : {})
    },
    { new: true, upsert: true }
  );

  // --- corn_data ---
  const cornDoc = await CornData.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        corn: 0,
        popcorn: 0,
        seed: 0,
        seeds: 0,
        g: 0,
        phase: 'IDLE',
        plantedAt: null,
        additives: { salt: 0, sugar: 0 }
      }
    },
    { new: true, upsert: true }
  );

  // --- 응답 평탄화 ---
  return {
    kakaoId: userDoc.kakaoId,
    nickname: userDoc.nickname ?? nickname ?? '',
    orcx: userDoc.orcx ?? 0,
    water: userDoc.water ?? 0,
    fertilizer: userDoc.fertilizer ?? 0,
    seedPotato: userDoc.seedPotato ?? 0,
    seedBarley: userDoc.seedBarley ?? 0,
    gamja: userDoc?.storage?.gamja ?? 0,
    bori: userDoc?.storage?.bori ?? 0,
    growthPotato: userDoc?.growth?.potato ?? 0,
    growthBarley: userDoc?.growth?.barley ?? 0,
    corn: cornDoc?.corn ?? 0,
    popcorn: cornDoc?.popcorn ?? 0,
    seed: cornDoc?.seed ?? 0,
    seeds: cornDoc?.seeds ?? 0,
    g: cornDoc?.g ?? 0,
    phase: cornDoc?.phase ?? 'IDLE',
    plantedAt: cornDoc?.plantedAt ?? null,
    salt: cornDoc?.additives?.salt ?? 0,
    sugar: cornDoc?.additives?.sugar ?? 0
  };
}
// POST /api/init-user
router.post('/api/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const result = await upsertAll(kakaoId, nickname);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[POST /api/init-user] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

module.exports = router;
