'use strict';
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

/* ===== 유틸 (신규 파일 없이 내부에만 추가) ===== */
function get(o, p, d) {
  try { return p.split('.').reduce((x, k) => (x == null ? x : x[k]), o); }
  catch { return d; }
}
function pickSeeds(obj) {
  // data.agri.seeds | data.agri.seed | seeds | seed 모두 허용
  const v = get(obj, 'data.agri.seeds',
            get(obj, 'data.agri.seed',
            obj?.seeds ?? obj?.seed));
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function buildIdOr(kakaoId) {
  const n = Number(kakaoId);
  const maybeNum = Number.isFinite(n) ? n : -1;
  return {
    $or: [
      { kakaoId: kakaoId }, { kakaoId: String(kakaoId) }, { kakaoId: maybeNum },
      { kakao_id: kakaoId }, { kakao_id: String(kakaoId) }, { kakao_id: maybeNum },
      { userId: kakaoId },   { userId: String(kakaoId) },   { userId: maybeNum },
    ]
  };
}

/* ===== 씨앗 단독 조회 (가장 단순, 프런트 연동 확인용) ===== */
router.get('/seed/:kakaoId', async (req, res) => {
  try {
    const cd = await mongoose.connection.collection('corn_data')
      .findOne(buildIdOr(req.params.kakaoId), { projection: { data: 1, seeds: 1, seed: 1 } });
    return res.json({ ok: true, seeds: pickSeeds(cd || {}) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ===== 물/거름 + 씨앗 요약 ===== */
router.get('/summary/:kakaoId', async (req, res) => {
  try {
    const idOr = buildIdOr(req.params.kakaoId);

    const u = await mongoose.connection.collection('users')
      .findOne(idOr, { projection: { 'inventory.water': 1, 'inventory.fertilizer': 1 } });
    const water = Number(u?.inventory?.water ?? 0);
    const fertilizer = Number(u?.inventory?.fertilizer ?? 0);

    const cd = await mongoose.connection.collection('corn_data')
      .findOne(idOr, { projection: { data: 1, seeds: 1, seed: 1 } });
    const seeds = pickSeeds(cd || {});

    return res.json({ ok: true, water, fertilizer, seeds });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
