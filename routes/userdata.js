const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 반드시 있어야 합니다

// ✅ 닉네임 일치 확인 도구 (대소문자/공백 무시)
router.get('/check-nickname/:nickname', async (req, res) => {
  const rawNickname = req.params.nickname;
  const regex = new RegExp(`^${rawNickname.trim()}$`, 'i'); // 공백 제거 + 대소문자 무시

  try {
    const user = await Farm.findOne({ nickname: regex });

    if (user) {
      res.json({
        match: true,
        originalNickname: user.nickname,
        token: user.token,
        water: user.water,
        potatoCount: user.potatoCount,
        barleyCount: user.barleyCount,
        seedPotato: user.seedPotato,
        message: `✅ 닉네임 "${user.nickname}" 존재합니다.`
      });
    } else {
      res.json({
        match: false,
        message: `❌ 닉네임 "${rawNickname}" 은(는) 존재하지 않습니다.`
      });
    }
  } catch (err) {
    res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

module.exports = router;
