const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 사용자 모델 경로 확인해주세요

// 🔧 유저 정보 업데이트 (ORCX 토큰, 닉네임, 물, 거름 등)
router.post('/', async (req, res) => {
  try {
    const { kakaoId, updateData } = req.body;

    if (!kakaoId || !updateData) {
      return res.status(400).json({ success: false, message: '필수 데이터 누락' });
    }

    const user = await User.findOneAndUpdate(
      { kakaoId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 찾을 수 없음' });
    }

    res.json({ success: true, message: '업데이트 성공', user });
  } catch (err) {
    console.error('업데이트 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
