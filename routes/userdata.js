const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ✅ test.users 스키마 (nickname 등 포함된 구조)
const User = mongoose.model('test_users', new mongoose.Schema({
  nickname: String,
  orcx: Number,
  farmingCount: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  harvestCount: Number,
  inventory: Array,
  exchangeLogs: Array,
  lastRecharge: Number
}, { collection: 'users' }));

// 🔍 GET /api/userdata/:nickname → 닉네임으로 유저 정보 조회
router.get('/:nickname', async (req, res) => {
  try {
    const rawNickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname: rawNickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ userdata.js 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
