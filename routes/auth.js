const express = require('express');
const router = express.Router();
const User = require('../models/users');  // ✅ 수정된 경로!

// 로그인 처리
router.post('/login', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: '카카오 ID와 닉네임은 필수입니다.' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        orcx: 10,
        water: 10,
        fertilizer: 10,
        seedPotato: 0,
        seedBarley: 0,
        storage: { gamja: 0, bori: 0 },
        growth: { potato: 0, barley: 0 }
      });
      await user.save();
    } else {
      await user.save();  // lastLogin 필드가 없어 불필요한 항목 제거
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
