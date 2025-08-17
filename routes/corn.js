// routes/corn.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// === 모델 (중복 컴파일 방지 + 호환성) ===
const CornDataSchema = new mongoose.Schema({
  kakaoId: { type: String, index: true },
  // 공식 필드: seeds
  seeds: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
}, { timestamps: true, strict: false }); // 과거에 들어온 'seed' 같은 키도 보존

const CornData = mongoose.models.CornData || mongoose.model('CornData', CornDataSchema);

// 호환 합산
const normalizeInv = (doc) => ({
  seeds: (doc?.seeds ?? 0) + (doc?.seed ?? 0),   // seed(과거) + seeds(현재) 합산
  popcorn: doc?.popcorn ?? 0,
  fertilizer: doc?.fertilizer ?? 0,
});

// 헬스체크
router.get('/__health', (req, res) => res.json({ ok: true }));

// 프로필/인벤토리 조회 (없으면 생성)
router.get('/profile/:kakaoId', async (req, res) => {
  try {
    const { kakaoId } = req.params;
    let doc = await CornData.findOne({ kakaoId });
    if (!doc) doc = await CornData.create({ kakaoId });
    return res.json({ kakaoId, ...normalizeInv(doc) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// 공통 구매 처리자: seeds와 seed를 동시에 증가시켜 호환 유지
async function buySeedHandler(req, res) {
  try {
    const { kakaoId, qty } = req.body;
    const delta = Number(qty ?? 1) || 1;
    const doc = await CornData.findOneAndUpdate(
      { kakaoId },
      { $inc: { seeds: delta, seed: delta } }, // 양쪽 모두 증가
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ ok: true, kakaoId, ...normalizeInv(doc) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// 프런트가 어떤 경로를 쓰든 걸리게 별칭 3개 제공 (수정 없이 동작하도록)
router.post('/seed/buy', buySeedHandler);
router.post('/buy/seed', buySeedHandler);
router.post('/seed-buy', buySeedHandler);

// (선택) 과거 데이터 정리: seed -> seeds로 합치고 seed 필드 제거
router.post('/__migrate/seed-to-seeds', async (req, res) => {
  try {
    const r = await CornData.updateMany(
      { seed: { $exists: true } },
      [
        { $set: { seeds: { $add: [ { $ifNull: ['$seeds', 0] }, { $ifNull: ['$seed', 0] } ] } } },
        { $unset: 'seed' }
      ]
    );
    return res.json({ ok: true, modified: r.modifiedCount ?? r.nModified });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
