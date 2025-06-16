const express = require('express');
const router = express.Router();

// POST /api/farm
router.post('/', (req, res) => {
  const nickname = req.body.nickname || req.params.nickname;

  // 닉네임 유효성 검사
  if (!nickname || typeof nickname !== 'string' || !nickname.trim().match(/^[a-zA-Z가-힣0-9_]{2,30}$/)) {
    return res.status(400).json({ success: false, message: "잘못된 nickname" });
  }

  // 정상 응답 (여기에 농장 로직, DB처리 등 추가 가능)
  res.json({ success: true, nickname });
});

module.exports = router;
