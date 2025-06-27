// 📁 routes/userdata.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 유저 데이터 불러오기 (/api/userdata?nickname=xxx)
router.get('/', async (req, res) => {
  const { nickname } = req.query;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });
  }

  try {
    const user = await User.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('🚨 유저 불러오기 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

// ✅ 유저 데이터 업데이트 (PATCH /api/userdata)
router.patch('/', async (req, res) => {
  const { nickname, ...changes } = req.body;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임이 없습니다.' });
  }

  try {
    // $set 에 changes 객체를 그대로 활용
    const user = await User.findOneAndUpdate(
      { nickname },
      { $set: changes },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('🚨 유저 업데이트 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;
