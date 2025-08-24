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
// 감자 & 보리 유저 처리 로직

  // 신규 유저일 경우 초기 자산 지급
  if (!user) {
    user = new User({
      kakaoId,
      nickname,
      water: 10,
      fertilizer: 10,
      tokens: 10,
      potato: 0,
      barley: 0,
      seedPotato: 0,
      seedBarley: 0,
      createdAt: new Date()
    });
    await user.save();
  }

  // 기존 유저이든 신규 유저이든 똑같이 데이터 반환
  return {
    kakaoId: user.kakaoId,
    nickname: user.nickname,
    water: user.water ?? 0,
    fertilizer: user.fertilizer ?? 0,
    tokens: user.tokens ?? 0,
    potato: user.potato ?? 0,
    barley: user.barley ?? 0,
    seedPotato: user.seedPotato ?? 0,
    seedBarley: user.seedBarley ?? 0,
    created: user.createdAt
  };
}
// ---- corn_data (옥수수) ----
  const corn = await CornData.findOneAndUpdate(
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

  // ---- 응답(숫자/문자만) 평탄화 ----
  return {
    kakaoId: user.kakaoId,
    nickname: user.nickname ?? nickname ?? '',
    // users 쪽
    orcx: user.orcx ?? 0,
    water: user.water ?? 0,
    fertilizer: user.fertilizer ?? 0,
    seedPotato: user.seedPotato ?? 0,
    seedBarley: user.seedBarley ?? 0,
    gamja: user?.storage?.gamja ?? 0,
    bori: user?.storage?.bori ?? 0,
    growthPotato: user?.growth?.potato ?? 0,
    growthBarley: user?.growth?.barley ?? 0,
    // corn_data 쪽
    corn: corn?.corn ?? 0,
    popcorn: corn?.popcorn ?? 0,
    seed: corn?.seed ?? 0,
    seeds: corn?.seeds ?? 0,
    g: corn?.g ?? 0,
    phase: corn?.phase ?? 'IDLE',
    plantedAt: corn?.plantedAt ?? null,
    salt: corn?.additives?.salt ?? 0,
    sugar: corn?.additives?.sugar ?? 0
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
