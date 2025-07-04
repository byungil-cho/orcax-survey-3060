const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET: 사용자 정보 조회
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: '유저 데이터 조회 실패', error: err.message });
  }
});

module.exports = router;
