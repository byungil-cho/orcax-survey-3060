const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1) 신규 또는 기존 유저 초기화 & 조회
router.post('/init', async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) return res.status(400).json({ error: '닉네임이 필요합니다.' });

    let user = await User.findOne({ nickname });
    if (!user) {
      user = new User({ nickname });
      await user.save();
      console.log(`✅ New user created: ${nickname}`);
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Init user error:', err);
    return res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// 2) 유저 정보 조회
router.get('/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, error: '사용자 없음' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, error: '서버 오류' });
  }
});

// 3) 자산 업데이트 (토큰/물/거름)
router.post('/update', async (req, res) => {
  try {
    const { nickname, orcx, water, fertilizer } = req.body;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, error: '사용자 없음' });

    if (orcx !== undefined) user.orcx = orcx;
    if (water !== undefined) user.water = water;
    if (fertilizer !== undefined) user.fertilizer = fertilizer;

    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, error: '서버 오류' });
  }
});

module.exports = router;