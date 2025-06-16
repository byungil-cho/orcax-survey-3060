const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm'); // 모델 경로 맞게 조정하세요

router.get('/:nickname', async (req, res) => {
  const rawNickname = req.params.nickname;

  if (!rawNickname || rawNickname.trim() === '') {
    return res.status(400).json({ error: "잘못된 nickname 입력" });
  }

  try {
    const regex = new RegExp(`^${rawNickname.trim()}$`, 'i');
    const user = await Farm.findOne({ nickname: regex });

    if (!user) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "서버 오류", detail: err.message });
  }
});

module.exports = router;
