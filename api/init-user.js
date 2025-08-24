// api/init-user.js
const express = require('express');
const router = express.Router();

async function upsertAll(kakaoId, nickname = '') {
  let user = await User.findOne({ kakaoId });

  // ---- users (감자/보리) ----
  const user = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        email: `user-${kakaoId}@noemail.local`,
        // 기본 자원
        water: 10,
        fertilizer: 10,
        orcx: 0,
        seedPotato: 0,
        seedBarley: 0,
        // 중첩 필드 기본값 (프론트가 여기서 읽는 경우 대비)
        'growth.potato': 0,
        'growth.barley': 0,
        'storage.gamja': 0,
        'storage.bori': 0,
        createdAt: new Date()
      },
      // 닉네임 보정 (기존값이 비었으면만)
      ...(nickname ? { $set: { nickname } } : {})
    },
    { new: true, upsert: true }
  );

  // ---- corn_data (옥수수) ----
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
}// POST /api/init-user
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
