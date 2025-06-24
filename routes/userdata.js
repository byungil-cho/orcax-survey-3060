const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/userdata?nickname=XXX
router.get('/userdata', async (req, res) => {
  const { nickname } = req.query;

  try {
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.json({ success: false, message: "유저 없음" });
    }

    res.json({
      success: true,
      users: [{
        nickname: user.nickname,
        orcx: user.orcx || 0,
        farmingCount: user.farmingCount || 0,
        water: user.water || 0,
        fertilizer: user.fertilizer || 0,
        potatoCount: user.potatoCount || 0,
        harvestCount: user.harvestCount || 0,
        seedPotato: user.seedPotato || 0,     // ✅ 씨감자 포함
        seedBarley: user.seedBarley || 0,     // ✅ 씨보리 포함
        inventory: user.inventory || [],
        exchangeLogs: user.exchangeLogs || [],
        lastRecharge: user.lastRecharge || 0
      }]
    });

  } catch (err) {
    console.error("❌ 유저 데이터 조회 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;