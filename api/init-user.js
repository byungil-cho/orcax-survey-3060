const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 경로 확인 필요

// 감자 유저 등록 및 초기 자산 지급
async function upsertAll(kakaoId, nickname = '') {
  const user = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
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
      }
    },
    { new: true, upsert: true }
  );

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

// GET 요청
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

// POST 요청
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
