const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 경로 확인 필요

// POST 요청 처리
router.post('/', async (req, res) => {
  const nickname = req.body.nickname || req.params.nickname;

  if (!nickname || typeof nickname !== 'string' || !nickname.trim().match(/^[a-zA-Z가-힣0-9_]{2,30}$/)) {
    return res.status(400).json({ success: false, message: "잘못된 nickname" });
  }

  try {
    const existingFarm = await Farm.findOne({ nickname });
    if (!existingFarm) {
      const newFarm = new Farm({ nickname, water: 10, fertilizer: 10, token: 5, seed: 2 });
      await newFarm.save();
      return res.json({ success: true, farm: newFarm });
    } else {
      return res.json({ success: true, farm: existingFarm });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "서버 오류", error });
  }
});

// ✅ GET 요청 처리 추가
router.get('/:nickname', async (req, res) => {
  const nickname = req.params.nickname;

  if (!nickname) {
    return res.status(400).json({ success: false, message: "nickname 없음" });
  }

  try {
    const farm = await Farm.findOne({ nickname });
    if (!farm) {
      return res.status(404).json({ success: false, message: "닉네임 정보 없음" });
    }
    return res.json({ success: true, farm });
  } catch (error) {
    return res.status(500).json({ success: false, message: "DB 조회 오류", error });
  }
});

module.exports = router;
