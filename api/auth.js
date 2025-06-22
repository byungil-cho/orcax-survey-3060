const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 시 초기 자산 지급 (최초 1회)
router.post('/login', async (req, res) => {
  const { nickname } = req.body;

  try {
    let user = await User.findOne({ nickname });

    if (!user) {
      // 신규 가입자 → 초기 자산 지급
      user = new User({
        nickname,
        token: 0,
        potatoCount: 0,
        barleyCount: 0,
        water: 10,
        fertilizer: 10,
        inventory: [
          { name: "씨감자", count: 2 },
          { name: "씨보리", count: 2 },
          { name: "물", count: 10 },
          { name: "거름", count: 10 }
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
