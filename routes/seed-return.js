// routes/seed-return.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SeedStock = require('../models/SeedStock');

// 씨앗 사용 후 관리자 보관소로 반환
router.post('/return', async (req, res) => {
  const { kakaoId, type } = req.body;

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 씨앗 보유 여부 확인
    if (!user.inventory[type] || user.inventory[type] <= 0) {
      return res.status(400).json({ success: false, message: '사용 가능한 씨앗이 없습니다.' });
    }

    // 유저 보유 씨앗 1개 차감
    user.inventory[type] -= 1;
    await user.save();

    // 관리자 씨앗 보관소 수량 증가
    await SeedStock.findOneAndUpdate(
      { type },
      { $inc: { quantity: 1 } },
      { upsert: true }
    );

    res.json({ success: true, message: `${type} 반환 완료`, inventory: user.inventory });
  } catch (error) {
    console.error('씨앗 반환 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
