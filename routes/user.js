
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 유저 존재 확인 및 생성
router.post('/register', async (req, res) => {
  const { nickname } = req.body;
  try {
    let user = await User.findOne({ nickname });
    if (!user) {
      user = new User({ nickname });
      await user.save();
      return res.json({ success: true, message: 'User created', user });
    }
    res.json({ success: true, message: 'User exists', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 유저 정보 조회
router.get('/info/:nickname', async (req, res) => {
  try {
    const user = await User.findOne({ nickname: req.params.nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
