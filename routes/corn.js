'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/* ----------------- 유틸 ----------------- */
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
  // 문자열/숫자/키 이름 변형까지 커버
  const maybeNum = Number(kakaoId);
  const variants = [
    { kakaoId: kakaoId },               // "12345"
    { kakaoId: String(kakaoId) },       // "12345"
    { kakaoId: Number.isFinite(maybeNum) ? maybeNum : -1 }, // 12345
    { kakao_id: kakaoId },
    { kakao_id: String(kakaoId) },
    { kakao_id: Number.isFinite(maybeNum) ? maybeNum : -1 },
    { userId: kakaoId },
    { userId: String(kakaoId) },
    { userId: Number.isFinite(maybeNum) ? maybeNum : -1 },
  ];
  return { $or: variants };
}

/* ----------------- 라우트 ----------------- */
/**
 * 씨앗만 단독 조회: 구매 후 값이 Mongo에 쓰였는데 화면에 0으로 뜨는 문제를
 * 가장 단순한 엔드포인트로 확정 진단/해결.
 *
 * 응답 예: { ok:true, seeds: 2 }
 */
router.get('/seed/:kakaoId', async (req, res) => {
  const kakaoId = req.params.kakaoId;
  try {
    const query = buildIdOr(kakaoId);
    const cd = await mongoose.connection
      .collection('corn_data')
      .findOne(query, { projection: { data: 1, seeds: 1, seed: 1 } });

    const seeds = pickSeeds(cd || {});
    return res.json({ ok: true, seeds });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* (옵션) 요약도 필요할 때 사용: 물/거름 + 씨앗 한 번에 */
router.get('/summary/:kakaoId', async (req, res) => {
  const kakaoId = req.params.kakaoId;
  try {
    // users: 물, 거름
    const u = await mongoose.connection.collection('users')
      .findOne(buildIdOr(kakaoId), { projection: { 'inventory.water': 1, 'inventory.fertilizer': 1 } });
    const water = Number(u?.inventory?.water ?? 0);
    const fertilizer = Number(u?.inventory?.fertilizer ?? 0);

    // corn_data: 씨앗
    const cd = await mongoose.connection.collection('corn_data')
      .findOne(buildIdOr(kakaoId), { projection: { data: 1, seeds: 1, seed: 1 } });
    const seeds = pickSeeds(cd || {});

    return res.json({ ok: true, water, fertilizer, seeds });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
