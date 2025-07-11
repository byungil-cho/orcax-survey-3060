const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 사용자 정보 조회 (POST 요청)
router.post('/userdata', async (req, res) => {
  const { kakaoId } = req.body;
  console.log('🔍 요청받은 kakaoId:', kakaoId);

  try {
    // 문자열로 변환하여 조회 (MongoDB에 저장된 형태와 일치)
    const users = await User.findOne({ kakaoId: String(kakaoId) });

    if (!users) {
      console.warn('⚠️ 사용자 정보 없음:', kakaoId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ 사용자 정보 조회 성공:', users);
    res.status(200).json({ success: true, data: users });

  } catch (error) {
    console.error('❌ 서버 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류', error: error.message });
  }
});

module.exports = router;

