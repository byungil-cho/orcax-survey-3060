const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/use-token
router.post('/', async (req, res) => {
  try {
    const { nickname, amount } = req.body;

    if (!nickname || !amount) {
      return res.status(400).json({ success: false, message: '필수 값 누락' });
    }

    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }

    if (user.token < amount) {
      return res.status(400).json({ success: false, message: '토큰 부족' });
    }

    user.token -= amount;

    // 씨감자는 inventory 안에서 관리되니까 그걸로 바꿔야 맞아
    const seedItem = user.inventory.find(item => item.name === '씨감자');
    if (seedItem) {
      seedItem.count += 1;
    } else {
      user.inventory.push({ name: '씨감자', count: 1 });
    }

    await user.save();

    return res.status(200).json({ success: true, token: user.token, inventory: user.inventory });
  } catch (error) {
    console.error('토큰 사용 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
