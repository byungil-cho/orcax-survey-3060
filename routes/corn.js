'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 유틸 (외부 신규파일 없이 로컬 내장)
function get(o, p, d) {
  try { return p.split('.').reduce((x, k) => (x == null ? x : x[k]), o); } catch { return d; }
}
function pickSeeds(obj) {
  // data.agri.seeds | data.agri.seed | seeds | seed 모두 허용
  const v = get(obj, 'data.agri.seeds',
            get(obj, 'data.agri.seed',
            obj?.seeds ?? obj?.seed));
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ----------------------------------------------------
   기존 라우트가 있다면 아래에 그대로 두시고,
   요약 엔드포인트만 '추가'되어 있습니다.
   ---------------------------------------------------- */

// 물/거름(users) + 씨앗(corn_data) 요약
router.get('/summary/:kakaoId', async (req, res) => {
  const kakaoId = req.params.kakaoId;
  try {
    // users 컬렉션: 물/거름
    const u = await mongoose.connection.collection('users')
      .findOne({ kakaoId }, { projection: { 'inventory.water': 1, 'inventory.fertilizer': 1 } });
    const water = Number(u?.inventory?.water ?? 0);
    const fertilizer = Number(u?.inventory?.fertilizer ?? 0);

    // corn_data 컬렉션: 씨앗(seeds/seed 어디에 있어도 인식)
    const cd = await mongoose.connection.collection('corn_data')
      .findOne({ kakaoId }, { projection: { data: 1, seeds: 1, seed: 1 } });
    const seeds = pickSeeds(cd || {});

    res.json({ ok: true, water, fertilizer, seeds });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
