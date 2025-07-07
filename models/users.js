// routes/user.js
const express = require('express');
const router = express.Router();
const db = require('../api/db'); // ← 이 부분 고침

router.get('/me', async (req, res) => {
  try {
    const kakaoId = req.session.kakaoId;

    if (!kakaoId) {
      return res.status(401).json({ error: '카카오 ID가 세션에 없음' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE kakaoId = ?', [kakaoId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없음' });
    }

    const user = rows[0];
    res.json({
      nickname: user.nickname,
      orcx: user.orcx,
      water: user.water,
      fertilizer: user.fertilizer,
      seed_potato: user.seed_potato,
      seed_barley: user.seed_barley,
      inventory: user.inventory,
    });
  } catch (err) {
    console.error('사용자 정보 가져오기 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
