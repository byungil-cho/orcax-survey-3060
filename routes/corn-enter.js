// routes/corn-enter.js
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const CornData = require('../models/CornData');

// ✅ 옥수수밭 입장 API
router.post('/api/corn-enter', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) {
      return res.status(400).json({ ok: false, message: 'kakaoId required' });
    }

    // 1. 유저 정보 불러오기 (감자밭)
    const userDoc = await User.findOne({ kakaoId });
    if (!userDoc) {
      return res.status(404).json({ ok: false, message: 'User not found. Please login first.' });
    }

    // 2. 옥수수 데이터 확인 후 없으면 생성
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

    // 3. 응답: users + corn_data 합본
    res.json({
      ok: true,
      kakaoId,
      nickname: userDoc.nickname ?? nickname ?? '',
      // users 쪽 자원
      water: userDoc.water ?? 0,
      fertilizer: userDoc.fertilizer ?? 0,
      tokens: userDoc.tokens ?? userDoc.orcx ?? 0,
      // corn_data 쪽 자원
      corn: cornDoc?.corn ?? 0,
      popcorn: cornDoc?.popcorn ?? 0,
      seed: cornDoc?.seed ?? 0,
      seeds: cornDoc?.seeds ?? 0,
      g: cornDoc?.g ?? 0,
      phase: cornDoc?.phase ?? 'IDLE',
      plantedAt: cornDoc?.plantedAt ?? null,
      salt: cornDoc?.additives?.salt ?? 0,
      sugar: cornDoc?.additives?.sugar ?? 0
    });
  } catch (e) {
    console.error('[POST /api/corn-enter] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

module.exports = router;
