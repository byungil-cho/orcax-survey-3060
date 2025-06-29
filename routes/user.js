const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 최초 로그인 & 초기 자산 지급
router.post('/init-user', async (req, res) => {
  const { nickname, kakaoId } = req.body;
  try {
    let user = await User.findOne({ kakaoId });
    if (user) {
      return res.json({ message: "이미 존재하는 유저", user });
    }
    user = new User({
      kakaoId,
      nickname,
      seedPotato: 2,
      seedBarley: 2,
      water: 10,
      fertilizer: 10,
      token: 10,
      growthPoint: 0,
      potatoCount: 0,
      harvestCount: 0,
      farmingCount: 0,
      inventory: []
    });
    await user.save();
    return res.json({ success: true, message: "신규 유저 등록 완료", user });
  } catch (err) {
    console.error("init-user 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 전체 유저 리스트 (디버그)
router.get('/userdata', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
