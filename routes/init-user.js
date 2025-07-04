const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "✅ 초기화 API 연결 성공" });
});

module.exports = router;
