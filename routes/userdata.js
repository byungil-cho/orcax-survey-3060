// routes/userdata.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ GET: 유저 조회만, 자동 생성 제거
router.get('/', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId required' });

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ POST: 유저 생성이 필요하면 별도 라우터를 만들 것. 여기선 조회만 유지
router.post('/', async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: 'kakaoId required' });

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
