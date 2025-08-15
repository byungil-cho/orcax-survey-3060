// routes/corn.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CornData = require('../models/CornData');

// 안전한 증가 필드 화이트리스트
const INC_ALLOWED = new Set(['seedCorn', 'corn', 'popcorn', 'additives.salt', 'additives.sugar', 'level']);

// 유틸: users 컬렉션에서 물/거름/토큰 가져오기 (감자 쪽 자원은 users에 있다고 하셨음)
async function getUserBasicsByKakaoId(kakaoId) {
  const usersCol = mongoose.connection.collection('users');
  const user = await usersCol.findOne({ kakaoId: String(kakaoId) }) || {};
  // 구조 방어 코드 (없으면 0으로)
  const inv = user.inventory || {};
  const wallet = user.wallet || {};
  return {
    water: Number(inv.water || 0),
    fertilizer: Number(inv.fertilizer || 0),
    tokens: Number(wallet.tokens || user.tokens || 0),
    nickname: user.nickname || user.name || '',
  };
}

// 1) 최초/보호용 업서트: 문서 없으면 생성, 있으면 손대지 않음
router.post('/upsert', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    const doc = await CornData.findOneAndUpdate(
      { kakaoId: String(kakaoId) },
      { $setOnInsert: { kakaoId: String(kakaoId), nickname } },
      { new: true, upsert: true }
    );

    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 2) 상태 조회 (corn_data만)
router.get('/status', async (req, res) => {
  try {
    const { kakaoId } = req.query;
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    const doc = await CornData.findOne({ kakaoId: String(kakaoId) });
    return res.json({ ok: true, data: doc || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 3) 옥수수 개요 조회: corn_data + users(물/거름/토큰)
router.get('/overview', async (req, res) => {
  try {
    const { kakaoId } = req.query;
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    const [cornDoc, basics] = await Promise.all([
      CornData.findOne({ kakaoId: String(kakaoId) }),
      getUserBasicsByKakaoId(kakaoId),
    ]);

    return res.json({
      ok: true,
      data: {
        corn: cornDoc || null,
        basics, // { water, fertilizer, tokens, nickname }
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 4) 값 증가/감소(원자적 업데이트). 예: { inc: { 'seedCorn': 1, 'additives.salt': -1 } }
router.post('/update', async (req, res) => {
  try {
    const { kakaoId, inc = {}, set = {} } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    // inc 화이트리스트 필터링
    const $inc = {};
    for (const [k, v] of Object.entries(inc)) {
      if (INC_ALLOWED.has(k) && Number(v)) $inc[k] = Number(v);
    }

    // set은 닉네임 정도만 허용(기존 기능 보호)
    const $set = {};
    if (typeof set?.nickname === 'string') $set.nickname = set.nickname;

    const update = {};
    if (Object.keys($inc).length) update.$inc = $inc;
    if (Object.keys($set).length) update.$set = $set;

    if (!Object.keys(update).length) {
      return res.status(400).json({ ok: false, error: 'no valid fields' });
    }

    const doc = await CornData.findOneAndUpdate(
      { kakaoId: String(kakaoId) },
      update,
      { new: true, upsert: true }
    );

    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 5) (옵션) 첨가물 초기화 같은 간단 유틸
router.post('/reset-additives', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, error: 'kakaoId required' });

    const doc = await CornData.findOneAndUpdate(
      { kakaoId: String(kakaoId) },
      { $set: { additives: { salt: 0, sugar: 0 } } },
      { new: true }
    );

    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
