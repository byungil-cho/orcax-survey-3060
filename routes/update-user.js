const express = require('express');
const router = express.Router();
const User = require('../models/User'); // ✅ 경로 확인 필요

// 🔧 유저 정보 업데이트 (토큰, 자원, 닉네임 등)
router.post('/', async (req, res) => {
  try {
    const { kakaoId, updateData } = req.body;

    // ✅ 필수 데이터 확인
    if (!kakaoId || typeof updateData !== 'object') {
      console.warn('[update-user] 잘못된 요청:', req.body);
      return res.status(400).json({ success: false, message: '필수 값 누락 또는 형식 오류' });
    }

    // ✅ email이 null이면 업데이트 대상에서 제거
    if ('email' in updateData && (updateData.email === null || updateData.email === undefined)) {
      delete updateData.email;
    }

    // ✅ 업데이트 실행
    const user = await User.findOneAndUpdate(
      { kakaoId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      console.warn('[update-user] 사용자 없음:', kakaoId);
      return res.status(404).json({ success: false, message: '사용자 찾을 수 없음' });
    }

    // ✅ 성공 응답
    res.json({ success: true, message: '업데이트 성공', user });

  } catch (err) {
    // ✅ Mongo 중복 키 오류 방어
    if (err.code === 11000) {
      console.error('[update-user] Mongo 중복키 오류:', err.keyValue);
      return res.status(409).json({ success: false, message: '중복된 데이터가 존재합니다.', conflict: err.keyValue });
    }

    console.error('[update-user] 서버 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 내부 오류' });
  }
});

module.exports = router;
