// routes/farm.js
const express = require('express');
const router = express.Router();

// 농사 상태 확인
router.get('/status', (req, res) => {
  res.json({ success: true, message: "Farm endpoint is operational" });
});

module.exports = router;
