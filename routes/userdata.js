const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.get('/userdata/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname;
    const user = await Farm.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }

    // ✅ 캐시 무효화: 항상 최신 데이터를 클라이언트로 전송
    res.setHeader('Cache-Control', 'no-store');

    res.json({
      success: true,
      nickname: user.nickname,
      potatoSeed: user.potatoSeed || 0,
      water: user.water || 0,
      fertilizer: user.fertilizer || 0,
      potato: user.potato || 0,
      growPoint: user.growPoint || 0, // ✅ 중요!!
      potatoProduct: user.potatoProduct || 0,
      barleyProduct: user.barleyProduct || 0
    });
  } catch (err) {
    console.error('서버 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
