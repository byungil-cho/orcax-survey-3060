const express = require('express');
const router = express.Router();

// 예시 데이터: 시장에 있는 아이템 수량
const marketData = {
  seedPotato: 150,
  seedBarley: 75,
  updateTime: new Date(),
};

// GET /market
router.get('/', (req, res) => {
  res.json({
    message: "시장 데이터 호출 성공",
    items: marketData,
  });
});

module.exports = router;
