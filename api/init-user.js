// api/init-user.js
const express = require('express');
const router = express.Router();

// 여기에 실제 DB 모델 import (예: User, CornData)
// const User = require('../models/User');
// const CornData = require('../models/CornData');

// 통합 upsert 함수
async function upsertAll(kakaoId, nickname = '') {
  // TODO: 실제 모델 로직 채워넣기
  // const user = await User.findOneAndUpdate(...);
  // const corn = await CornData.findOneAndUpdate(...);
  return { kakaoId, nickname, ok: true };
}

// GET /api/init-user
router.get('/api/init-user', async (req, res) => {
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
