const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 🌾 보리 수확 API
router.post('/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;

  if (!nickname || typeof amount !== 'number') {
    return res.status(400).json({ success: false, message: '닉네임과 수확량이 필요합니다.' });
  }

  try {
    let user = await Farm.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '해당 유저를 찾을 수 없습니다.' });
    }

    user.barleyCount = (user.barleyCount || 0) + amount;
    await user.save();

    res.json({ success: true, message: `${amount}개 보리 수확 완료`, barleyCount: user.barleyCount });
  } catch (err) {
    console.error('보리 수확 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류로 보리 수확 실패' });
  }
});

module.exports = router;
