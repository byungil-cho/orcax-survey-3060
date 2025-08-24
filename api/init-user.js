// api/init-user.js
const express = require('express');
const router = express.Router();

// 네 프로젝트 경로에 맞춰라.
const User = require('../models/User');
const CornData = require('../models/CornData');

// 통합 upsert (users + corn_data)
async function upsertAll(kakaoId, nickname = '') {
  // 1) 감자/보리: users 컬렉션 (기존 값 유지, 신규만 기본 지급)
  const user = await User.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        nickname,
        // 기본 자원
        water: 10,
        fertilizer: 10,
        tokens: 10,
        // 농작물/씨앗 기본값 (숫자만)
        potato: 0,
        barley: 0,
        seedPotato: 0,
        seedBarley: 0,
        createdAt: new Date()
      },
      // 닉네임이 비어있던 애들 보정
      ...(nickname ? { $set: { nickname } } : {})
    },
    { new: true, upsert: true }
  );

  // 2) 옥수수: corn_data 컬렉션 (신규만 기본 지급)
  const corn = await CornData.findOneAndUpdate(
    { kakaoId },
    {
      $setOnInsert: {
        kakaoId,
        // 옥수수 관련 기본값(숫자만! 객체 말고)
        corn: 0,          // 보유 옥수수
        popcorn: 0,       // 팝콘
        seed: 0,          // 씨앗
        seeds: 0,         // 네가 둘 다 쓰고 있더라; 0으로 시작
        g: 0,             // 경험치/게이지 같은 거면 0
        phase: 'IDLE',
        plantedAt: null,
        // 첨가물은 하위객체로 저장하되, 응답은 숫자로 풀어서 보낸다
        additives: { salt: 0, sugar: 0 }
      }
    },
    { new: true, upsert: true }
  );

  // 3) 프론트로 내려갈 값 (모두 "숫자/원시값"으로만)
  //    object Object 뜨지 않게 평탄화해서 보냄.
  return {
    // 공통
    kakaoId: user.kakaoId,
    nickname: user.nickname ?? nickname ?? '',
    // users 쪽
    water: user.water ?? 0,
    fertilizer: user.fertilizer ?? 0,
    tokens: user.tokens ?? 0,
    potato: user.potato ?? 0,
    barley: user.barley ?? 0,
    seedPotato: user.seedPotato ?? 0,
    seedBarley: user.seedBarley ?? 0,
    // corn_data 쪽(숫자만!)
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

// GET /api/init-user
router.get('/api/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.query || {};
    if (!kakaoId) return res.status(400).json({ ok: false, success: false, message: 'kakaoId required' });

    const result = await upsertAll(kakaoId, nickname);
    res.json({ ok: true, success: true, ...result }); // success도 같이 내려줘서 구버전 프론트 호환
  } catch (e) {
    console.error('[GET /api/init-user] error:', e);
    res.status(500).json({ ok: false, success: false, error: String(e?.message || e) });
  }
});

// POST /api/init-user
router.post('/api/init-user', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, success: false, message: 'kakaoId required' });

    const result = await upsertAll(kakaoId, nickname);
    res.json({ ok: true, success: true, ...result });
  } catch (e) {
    console.error('[POST /api/init-user] error:', e);
    res.status(500).json({ ok: false, success: false, error: String(e?.message || e) });
  }
});

module.exports = router;
