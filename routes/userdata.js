const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// GET /api/userdata?kakaoId=xxx
// ── DB에서 해당 kakaoId 유저 정보만 골라 보냄
router.get('/', async (req, res) => {
  const { kakaoId } = req.query;

  if (!kakaoId) {
    return res.status(400).json({ success: false, error: 'kakaoId가 필요합니다.' });
  }

  try {
    const user = await User.findOne({ kakaoId })
      .select('orcx seedPotato seedBarley water fertilizer potato inventory');

    if (!user) {
      return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ userdata 조회 실패:', err);
    res.status(500).json({ success: false, error: '서버 오류' });
  }
});

module.exports = router;
