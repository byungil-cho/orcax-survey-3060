const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 시 초기 자산 지급 (최초 1회)
router.post('/login', async (req, res) => {
  const { nickname } = req.body;

  try {
    let user = await User.findOne({ nickname });

    if (!user) {
      // 신규 가입자 → 핵심 자산은 필드로, 나머지는 인벤토리로 분리 저장
      user = new User({
        nickname,
        token: 0,
        potatoCount: 0,
        barleyCount: 0,
        water: 10,
        fertilizer: 10,
        seedPotato: 2,      // ✅ 핵심 자산은 모델 필드에 직접 저장
        seedBarley: 2,
        inventory: [
          // 가공 제품만 inventory에 저장
          { name: "감자깡", count: 0 },
          { name: "감자국수", count: 0 }
        ]
      });

      await user.save();
      return res.json({ success: true, firstTime: true, user });
    } else {
      // 기존 유저는 자산 지급 생략
      return res.json({ success: true, firstTime: false, user });
    }

  } catch (error) {
    console.error("❌ 로그인 에러:", error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;