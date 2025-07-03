const express = require('express');
const router = express.Router();
const users = require('../models/users');

// 사용자 정보 불러오기
router.get('/userdata', async (req, res) => {
  const { kakaoId, nickname } = req.query;
  try {
    if (!kakaoId && !nickname) return res.status(400).json({ error: 'kakaoId 또는 nickname이 필요합니다.' });
    const query = kakaoId ? { kakaoId } : { nickname };
    const user = await users.findOne(query);
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ user });
  } catch (err) {
    console.error('GET /userdata 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 사용자 정보 업데이트
router.post('/update-user', async (req, res) => {
  const { kakaoId, nickname, ...changes } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: 'kakaoId와 nickname이 필요합니다.' });
  try {
    const updated = await users.findOneAndUpdate(
      { kakaoId, nickname },
      { $set: changes },
      { new: true, upsert: true }
    );
    res.json({ user: updated });
  } catch (err) {
    console.error('POST /update-user 오류:', err);
    res.status(500).json({ error: '업데이트 실패' });
  }
});

module.exports = router;
