const express = require('express');
const router = express.Router();
const User = require('../models/users');  // ✅ 정확하게 수정됨

// 로그인 요청 처리
router.post('/login', async (req, res) => {
  const { kakaoId, nickname, email } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ success: false, message: '카카오 ID와 닉네임은 필수입니다.' });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      // 새 유저 생성
      user = new User({
        kakaoId,
        nickname,
        email: email || null,
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
      // 기존 유저 로그인 기록 업데이트
      user.lastLogin = new Date();  // 필드가 없어도 일단 임시로 추가 가능
      await user.save();
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
