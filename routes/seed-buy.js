const express = require('express');
const router = express.Router();
const SeedStock = require('../models/SeedStock');
const User = require('../models/User');

// 씨앗 구매
router.post('/buy', async (req, res) => {
  const { kakaoId, seedType } = req.body;
  const seedCost = 2;

  try {
    const stock = await SeedStock.findOne({ type: seedType });
    if (!stock || stock.quantity <= 0) {
      return res.json({ success: false, message: "재고 부족" });
    }

    const user = await User.findOne({ kakaoId });
    if (!user || user.orcx < seedCost) {
      return res.json({ success: false, message: "토큰 부족" });
    }

    // 제한: 씨앗 2개 이상 보유 금지
    if (user[seedType] >= 2) {
      return res.json({ success: false, message: "씨앗 최대 보유 수 초과" });
    }

    // 구매 처리
    user.orcx -= seedCost;
    user[seedType] += 1;
    await user.save();

    stock.quantity -= 1;
    await stock.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
