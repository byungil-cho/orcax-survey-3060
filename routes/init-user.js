// routes/init-user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserInventory = require('../models/UserInventory');

router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId) {
    return res.status(400).json({
      success: false,
      message: 'kakaoId is required'
    });
  }

  try {
    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다. 먼저 회원가입하세요.'
      });
    }

    // 닉네임 변경 시 업데이트
    if (nickname && user.nickname !== nickname) {
      user.nickname = nickname;
      await user.save();
    }

    // 인벤토리 가져오기
    const inventory = await UserInventory.findOne({ kakaoId });

    res.json({
      success: true,
      user: {
        nickname: user.nickname,
        orcx: user.orcx,
        water: user.water,
        fertilizer: user.fertilizer,
        seedPotato: inventory?.seedPotato ?? 0,
        seedBarley: inventory?.seedBarley ?? 0,
        potato: inventory?.potato ?? 0,
        barley: inventory?.barley ?? 0,
        inventory: inventory?.items ?? []
      }
    });
  } catch (err) {
    console.error('❌ init-user 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
