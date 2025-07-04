const express = require('express');
const router = express.Router();
const User = require('../models/User'); // ✅ 경로 반드시 확인해주세요

router.post('/', async (req, res) => {
  try {
    const { kakaoId, updateData } = req.body;

    if (!kakaoId || typeof updateData !== 'object') {
      console.warn('[update-user] 잘못된 요청:', req.body);
      return res.status(400).json({ success: false, message: '필수 값 누락 또는 형식 오류' });
    }

    const user = await User.findOneAndUpdate(
      { kakaoId: kakaoId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      console.warn('[update-user] 사용자 없음:', kakaoId);
      return res.status(404).json({ success: false, message: '사용자 찾을 수 없음' });
    }

    res.json({ success: true, message: '업데이트 성공', user });
  } catch (err) {
    console.error('[update-user] 서버 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 내부 오류' });
  }
});

module.exports = router;
