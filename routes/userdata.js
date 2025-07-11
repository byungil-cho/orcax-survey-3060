const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 경로는 실제 User 모델에 맞게 조정

// ✅ 사용자 정보 불러오기
router.post('/', async (req, res) => {
  try {
    console.log("🔍 받은 요청 req.body:", req.body);

    const { kakaoId } = req.body;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId is missing' });
    }

    const users = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('❌ /api/userdata 오류:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
