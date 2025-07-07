// routes/userdata.js
const express = require('express');
const router = express.Router();

// 사용자 데이터를 가져오는 가짜 예제
router.get('/', async (req, res) => {
  // 실제 DB에서 사용자 데이터 조회하는 코드가 필요함
  res.json({
    nickname: '범고래X',
    gamja: 0,
    water: 0,
    fertilizer: 0,
    orcx: 0,
    seed: 0,
    sprout: 0,
    inventory: []
  });
});

module.exports = router;