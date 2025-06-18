const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// test 데이터베이스의 users 컬렉션 접근
const userSchema = new mongoose.Schema({
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
}, { collection: 'users' });

const TestUser = mongoose.connection.useDb('test').model('User', userSchema);

router.get('/userdata/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const user = await TestUser.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('[❌ 사용자 조회 오류]', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
