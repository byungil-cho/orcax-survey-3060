// api/init-user.js
const express = require('express');
const router = express.Router();

const User = require('../models/User');         
const CornData = require('../models/CornData'); 

// ✅ 절대 기존 데이터 덮어쓰지 않음
async function upsertAll(kakaoId, nickname = '') {
  // --------------------------
  // 1) 감자/보리(User)
  // --------------------------
  let user = await User.findOne({ kakaoId });
  if (!user) {
    user = new User({
      kakaoId,
      nickname,
      wallet: { tokens: 10 }, 
      inventory: {
        water: 10,
        fertilizer: 10,
        potato: 0,
        barley: 0,
      }
    });
    await user.save();
  }

  // --------------------------
  // 2) 옥수수(CornData)
  // --------------------------
  let cornDoc = await CornData.findOne({ kakaoId });
  if (!cornDoc) {
    cornDoc = new CornData({
      kakaoId,
      corn: 0,
      popcorn: 0,
      seed: 0,
      additives: { salt: 0, sugar: 0 }
    });
    await cornDoc.save();
  }

  // --------------------------
  // 3) 감자 + 옥수수 합쳐서 응답만 반환
  // --------------------------
  return {
    kakaoId,
    nickname: user.nickname,
    tokens: user.wallet?.tokens ?? user.tokens ?? 0,
    inventory: {
      // 감자/보리
      water: user.inventory?.water ?? 0,
      fertilizer: user.inventory?.fertilizer ?? 0,
      potato: user.inventory?.potato ?? 0,
      barley: user.inventory?.barley ?? 0,

      // 옥수수
      corn: cornDoc?.corn ?? 0,
      popcorn: cornDoc?.popcorn ?? 0,
      seed: cornDoc?.seed ?? 0,         
      salt: cornDoc?.additives?.salt ?? 0,
      sugar: cornDoc?.additives?.sugar ?? 0,
    }
  };
}

// GET /api/init-user
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
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
