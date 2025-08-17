// routes/corn.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// === 모델 (중복 컴파일 방지 + 유연 스키마) ===
const CornDataSchema = new mongoose.Schema({
  kakaoId: { type: String, index: true },
  // 공식 키: seeds (하지만 과거 seed도 함께 유지)
  seeds: { type: Number, default: 0 },

  // UI에서 쓰는 값들(필요시 자동 생성됨)
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },

  // 첨가물
  additives: {
    salt: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
  },

  // 성장/상태 관련 (있으면 그대로 씀)
  g: { type: Number, default: 0 },
  phase: { type: String, default: 'IDLE' },
  plantedAt: { type: Date, default: null },
}, { timestamps: true, strict: false }); // strict:false로 'seed' 등 과거키 보존

const CornData = mongoose.models.CornData || mongoose.model('CornData', CornDataSchema);

// 합산 정규화: seed(과거) + seeds(현재)
const sumSeeds = (doc) => (doc?.seeds ?? 0) + (doc?.seed ?? 0);
const safe = (v, d=0) => (typeof v === 'number' ? v : (v ?? d));

// 헬스체크
router.get('/__health', (req, res) => res.json({ ok: true }));

// 상태 조회: 스샷과 동일한 필드 묶어서 반환
router.get('/state/:kakaoId', async (req, res) => {
  try {
    const kakaoId = String(req.params.kakaoId);
    let doc = await CornData.findOne({ kakaoId }).lean();
    if (!doc) {
      // 최초 접근 시 문서 생성
      doc = (await CornData.create({ kakaoId })).toObject();
    }
    return res.json({
      kakaoId,
      // 씨앗: seed + seeds 합산
      seeds: sumSeeds(doc),

      // 작물/가공품
      corn: safe(doc.corn),
      popcorn: safe(doc.popcorn),

      // 첨가물
      additives: {
        salt: safe(doc?.additives?.salt),
        sugar: safe(doc?.additives?.sugar),
      },

      // 성장/상태
      g: safe(doc.g),
      phase: doc.phase ?? 'IDLE',
      plantedAt: doc.plantedAt ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// 공통: 씨앗 구매(증가) — 호환 위해 seed/seeds 둘 다 증가
async function buySeedHandler(req, res) {
  try {
    const kakaoId = String(req.body.kakaoId ?? '');
    if (!kakaoId) return res.status(400).json({ error: 'kakaoId required' });
    const delta = Number(req.body.qty ?? 1) || 1;

    const doc = await CornData.findOneAndUpdate(
      { kakaoId },
      { $inc: { seeds: delta, seed: delta } }, // 양쪽 올려 호환 유지
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      ok: true,
      kakaoId,
      seeds: sumSeeds(doc),
      corn: safe(doc.corn),
      popcorn: safe(doc.popcorn),
      additives: {
        salt: safe(doc?.additives?.salt),
        sugar: safe(doc?.additives?.sugar),
      },
      g: safe(doc.g),
      phase: doc.phase ?? 'IDLE',
      plantedAt: doc.plantedAt ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 프런트가 어떤 경로를 쓰든 걸리게 별칭 다 열어둠
router.post('/seed/buy', buySeedHandler);
router.post('/buy/seed', buySeedHandler);
router.post('/seed-buy', buySeedHandler);

// (선택) 과거 데이터 정리: seed -> seeds로 합치고 seed 제거
router.post('/__migrate/seed-to-seeds', async (req, res) => {
  try {
    const r = await CornData.updateMany(
      { seed: { $exists: true } },
      [
        { $set: { seeds: { $add: [ { $ifNull: ['$seeds', 0] }, { $ifNull: ['$seed', 0] } ] } } },
        { $unset: 'seed' },
      ]
    );
    // MongoDB 버전에 따라 modifiedCount 또는 nModified
    return res.json({ ok: true, modified: r.modifiedCount ?? r.nModified ?? 0 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
