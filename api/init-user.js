// api/init-user.js
'use strict';
const express = require('express');
const router = express.Router();

// ✅ 실제 모델 import (파일 경로는 프로젝트 구조에 맞게 조정)
const User = require('../models/user');
const CornData = require('../models/cornData');

// 공통: 안전 숫자
const N = (v, d=0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ✅ 통합 upsert 로직 (한 곳에서만 정의)
async function upsertAll(kakaoId, nickname = '') {
  // --- users ---
  const userDoc = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        // ⚠ email은 절대 null이 되지 않도록 더미값 부여
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
      // 닉네임이 들어왔으면 갱신
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
        seeds: 0,     // 과거 호환 필드
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
    orcx: N(userDoc.orcx),
    water: N(userDoc.water),
    fertilizer: N(userDoc.fertilizer),
    seedPotato: N(userDoc.seedPotato),
    seedBarley: N(userDoc.seedBarley),
    gamja: N(userDoc?.storage?.gamja),
    bori: N(userDoc?.storage?.bori),
    growthPotato: N(userDoc?.growth?.potato),
    growthBarley: N(userDoc?.growth?.barley),

    corn: N(cornDoc?.corn),
    popcorn: N(cornDoc?.popcorn),
    seed: N(cornDoc?.seed),
    seeds: N(cornDoc?.seeds),
    g: N(cornDoc?.g),
    phase: cornDoc?.phase ?? 'IDLE',
    plantedAt: cornDoc?.plantedAt ?? null,
    salt: N(cornDoc?.additives?.salt),
    sugar: N(cornDoc?.additives?.sugar),
  };
}

// GET /api/init-user  (또는 /init-user)
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

// POST /api/init-user  (또는 /init-user)
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
