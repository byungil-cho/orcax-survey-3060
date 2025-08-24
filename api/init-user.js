// api/init-user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 실제 경로 맞춰야 함

// 감자보리 유저 upsert
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
        createdAt: new Date()
      }
    },
    { new: true, upsert: true }
  );

  return {
    kakaoId: user.kakaoId,
    nickname: user.nickname,
    water: user.water,
    fertilizer: user.fertilizer,
    tokens: user.tokens,
    created: user.createdAt
  };
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
