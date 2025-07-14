const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        farmName: `${nickname}의 감자농장`,
        inventory: {
          water: 10,
          fertilizer: 10,
          seedPotato: 0,
          seedBarley: 0
        },
        storage: {
          gamja: 0,
          bori: 0
        },
        wallet: {
          orcx: 10
        }
      });
      await user.save();
      console.log(`[✅ 신규 사용자 생성]: ${kakaoId}`);
    } else {
      console.log(`[🔁 기존 사용자 로그인]: ${kakaoId}`);
    }

    res.json({ message: '유저 초기화 완료', success: true, user });
  } catch (err) {
    console.error('[❌ init-user 오류]:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
