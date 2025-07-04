const express = require('express');
const router = express.Router();
const users = require('../models/users');

// 사용자 정보 업데이트
router.post('/update-user', async (req, res) => {
  const { kakaoId, nickname, ...changes } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ error: 'kakaoId와 nickname이 필요합니다.' });
  }

  try {
    const updated = await users.findOneAndUpdate(
      { kakaoId, nickname },
      { $set: changes },
      { new: true, upsert: true }
    );

    res.json({ user: updated });
  } catch (err) {
    console.error('POST /update-user 오류:', err);
    res.status(500).json({ error: '업데이트 실패', details: err.message });
  }
});

module.exports = router;
