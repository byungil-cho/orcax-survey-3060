const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 시 초기 자산 지급 (최초 1회 또는 누락 보정 포함)
router.post('/login', async (req, res) => {
  const { nickname } = req.body;

  try {
    let user = await User.findOne({ nickname });

    if (!user) {
      // 신규 가입자 → 모든 자산 초기화 지급
      user = new User({
        nickname,
        token: 0,
        potatoCount: 0,
        barleyCount: 0,
        water: 10,
        fertilizer: 10,
        seedPotato: 2,      // ✅ 모델 필드 직접 저장
        seedBarley: 2,
        inventory: [
          { name: "감자깡", count: 0 },
          { name: "감자국수", count: 0 }
        ]
      });

      await user.save();
      return res.json({ success: true, firstTime: true, user });
    } else {
      // 기존 유저라도 seed 필드가 없으면 자동 보정 (정상 흐름 유도)
      let updated = false;
      if (user.seedPotato === undefined) {
        user.seedPotato = 2;
        updated = true;
      }
      if (user.seedBarley === undefined) {
        user.seedBarley = 2;
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      return res.json({ success: true, firstTime: false, user });
    }

  } catch (error) {
    console.error("❌ 로그인 에러:", error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;