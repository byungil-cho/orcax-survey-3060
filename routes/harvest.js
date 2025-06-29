
// -------------- harvest.js --------------

// harvest.js (in routes folder)
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 유저 모델 불러오기

router.post('/api/harvest', async (req, res) => {
  const { nickname, harvestedPotatoes, usedSeed } = req.body;

  try {
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });

    // 씨감자 1개 줄이고 감자 수확한 만큼 증가
    if (user.seed < usedSeed) {
      return res.json({ success: false, message: '씨감자가 부족합니다.' });
    }

    user.seed -= usedSeed;
    user.potato += harvestedPotatoes;

    await user.save();

    return res.json({ 
      success: true, 
      potato: user.potato,
      seed: user.seed,
      message: '수확 저장 완료'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;

