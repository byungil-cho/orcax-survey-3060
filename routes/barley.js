const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const ProductLog = require('../models/ProductLog'); // ✅ 로그 모델 불러오기

// ✅ 보리 수확 처리
router.post('/harvest-barley', async (req, res) => {
  const { nickname } = req.body;

  try {
    const farm = await Farm.findOne({ nickname });
    if (!farm) {
      return res.status(404).json({ success: false, message: '사용자 정보 없음' });
    }

    // 보리 수확 조건 확인
    const { water, fertilizer } = farm;
    if (water < 1 || fertilizer < 1) {
      return res.status(400).json({ success: false, message: '물과 거름이 부족합니다' });
    }

    // 자원 차감 및 보리 추가
    const earned = Math.floor(Math.random() * 5) + 1; // 1~5 랜덤 수확량
    farm.water -= 1;
    farm.fertilizer -= 1;
    farm.barleyCount = (farm.barleyCount || 0) + earned;
    await farm.save();

    // ✅ 수확 로그 기록
    await ProductLog.create({
      nickname,
      productType: 'barley',
      quantity: earned
    });

    res.json({
      success: true,
      message: `${earned}말의 보리를 수확했습니다!`,
      earned,
      barleyCount: farm.barleyCount
    });
  } catch (err) {
    console.error('수확 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

// ✅ 보리 제품 로그 조회
router.get('/barley-products/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const logs = await ProductLog.find({ nickname, productType: 'barley' }).sort({ timestamp: -1 });
    if (!logs || logs.length === 0) {
      return res.status(404).json({ success: false, message: '보리 수확 로그 없음' });
    }

    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('보리 로그 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
