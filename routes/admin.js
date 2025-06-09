const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 전체 유저 리스트 반환
router.get('/users', async (req, res) => {
  try {
    const users = await Farm.find({}, 'nickname water fertilizer token potatoCount freeFarmCount lastFreeTime');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "유저 불러오기 실패" });
  }
});

module.exports = router;
