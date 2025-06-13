const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // ✅ 제품 모델
const Farm = require('../models/Farm');       // ✅ 유저(농장) 모델

// ✅ 쿼리로 닉네임 받아서 유저 정보 반환
router.get('/', async (req, res) => {
  try {
    const nickname = req.query.nickname;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ error: '유저 없음' });

    res.json({
      nickname: user.nickname,
      potatoCount: user.potatoCount,
      barleyCount: user.barleyCount,
      seedPotato: user.seedPotato,
      token: user.token,
      water: user.water,
      fertilizer: user.fertilizer
    });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 닉네임으로 제품 목록 조회
router.get('/:nickname', async (req, res) => {
  const nickname = req.params.nickname;

  try {
    const products = await Product.find({ nickname });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: '해당 유저의 제품이 없습니다.' });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;

