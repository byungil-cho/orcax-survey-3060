'use strict';
const express = require('express');
const router = express.Router();

// ❗ 실제 모델 경로에 맞춰 수정
const User = require('../models/user');
const CornData = require('../models/cornData');

const N = (v, d=0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ✅ 한 곳에서만 정의되는 업서트 함수
async function upsertAll(kakaoId, nickname='') {
  // users
  const user = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        // ⚠ email은 null 금지. 더미 이메일 부여
        email: `user-${kakaoId}@noemail.local`,
        water: 10, fertilizer: 10, orcx: 0,
        seedPotato: 0, seedBarley: 0,
        'storage.gamja': 0, 'storage.bori': 0,
        'growth.potato': 0, 'growth.barley': 0,
        createdAt: new Date()
      },
      ...(nickname ? { $set: { nickname } } : {})
    },
    { new: true, upsert: true }
  );

  // corn_data
  const corn = await CornData.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        corn: 0, popcorn: 0,
        seed: 0, seeds: 0, g: 0,   // seeds는 과거 호환
        phase: 'IDLE', plantedAt: null,
        additives: { salt: 0, sugar: 0 }
      }
    },
    { new: true, upsert: true }
  );

  return {
    kakaoId: user.kakaoId,
    nickname: user.nickname ?? nickname ?? '',
    orcx: N(user.orcx),
    water: N(user.water),
    fertilizer: N(user.fertilizer),
    seedPotato: N(user.seedPotato),
    seedBarley: N(user.seedBarley),
    gamja: N(user?.storage?.gamja),
    bori: N(user?.storage?.bori),
    growthPotato: N(user?.growth?.potato),
    growthBarley: N(user?.growth?.barley),

    corn: N(corn?.corn),
    popcorn: N(corn?.popcorn),
    seed: N(corn?.seed),
    seeds: N(corn?.seeds),
    g: N(corn?.g),
    phase: corn?.phase ?? 'IDLE',
    plantedAt: corn?.plantedAt ?? null,
    salt: N(corn?.additives?.salt),
    sugar: N(corn?.additives?.sugar),
  };
}

// GET /api/init-user (메인에서 /api 붙였으므로 여기선 /init-user 만 사용)
router.get('/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname='' } = req.query || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const data = await upsertAll(kakaoId, nickname);
    res.json({ ok:true, ...data });
  } catch (e) {
    if (e?.code === 11000) return res.json({ ok:true, duplicated:true });
    console.error('[GET /init-user] error:', e);
    res.status(500).json({ ok:false, error: String(e?.message||e) });
  }
});

router.post('/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname='' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok:false, message:'kakaoId required' });
    const data = await upsertAll(kakaoId, nickname);
    res.json({ ok:true, ...data });
  } catch (e) {
    if (e?.code === 11000) return res.json({ ok:true, duplicated:true });
    console.error('[POST /init-user] error:', e);
    res.status(500).json({ ok:false, error: String(e?.message||e) });
  }
});

module.exports = router;
