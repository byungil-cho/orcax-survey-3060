const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 유저 모델

// nickname으로 유저 정보 조회
router.get('/:nickname', async (req, res) => {
  try {
    const user = await User.findOne({ nickname: req.params.nickname });
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err });
  }
});

// kakaoId로 유저 정보 조회
router.get('/kakao/:kakaoId', async (req, res) => {
  try {
    const user = await User.findOne({ kakaoId: req.params.kakaoId });
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err });
  }
});

// 유저 정보 업데이트
router.post('/update-user', async (req, res) => {
  const { kakaoId, nickname, ...updates } = req.body;
  if (!kakaoId || !nickname) {
    return res.status(400).json({ error: '필수 정보 누락 (kakaoId, nickname)' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { kakaoId, nickname },
      { $set: updates },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '업데이트 오류', details: err });
  }
});

module.exports = router;
