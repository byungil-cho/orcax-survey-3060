// backend/api/init-user.js
const express = require('express');
const router = express.Router();

const User = require('../models/user');       // 감자보리 농장(users 컬렉션)
const CornData = require('../models/cornData'); // 옥수수 농장(corn_data 컬렉션)

/**
 * 통합 upsert: users + corn_data 동시에 보장
 */
async function upsertAll(kakaoId, nickname = '') {
  // users 컬렉션 초기화/갱신
  const user = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        tokens: 0,
        water: 0,
        fertilizer: 0,
        isBankrupt: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      $set: {
        nickname,
        updatedAt: new Date(),
      }
    },
    { upsert: true, new: true }
  );

  // corn_data 컬렉션 초기화/갱신
  const corn = await CornData.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        seed: 0,
        popcorn: 0,
        corn: [],
        additives: { salt: 0, sugar: 0 },
        loan: {
          amount: 0,
          interest: 0,
          createdAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      $set: {
        updatedAt: new Date(),
      }
    },
    { upsert: true, new: true }
  );

  return { kakaoId, nickname, user, corn };
}

// ------------------ Routes ------------------

// GET /api/init-user?kakaoId=...&nickname=...
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

// POST /api/init-user { kakaoId, nickname }
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
