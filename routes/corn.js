// routes/corn.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// === CornData 모델 (중복 컴파일 방지) ===
const CornDataSchema = new mongoose.Schema({
  kakaoId: { type: String, index: true },
  seeds: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
}, { timestamps: true });

// 이미 컴파일돼 있으면 재사용, 없으면 생성
const CornData = mongoose.models.CornData || mongoose.model('CornData', CornDataSchema);

// === 라우트 ===
// 헬스체크
router.get('/__health', (req, res) => res.json({ ok: true }));

// 유저 프로필 조회/자동생성 예시
router.get('/profile/:kakaoId', async (req, res) => {
  try {
    const { kakaoId } = req.params;
    let doc = await CornData.findOne({ kakaoId });
    if (!doc) doc = await CornData.create({ kakaoId });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
