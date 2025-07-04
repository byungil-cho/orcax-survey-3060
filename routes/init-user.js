const express = require('express');
const router = express.Router();

// 기존 GET 라우터
router.get("/", (req, res) => {
  res.json({ success: true, message: "✅ 초기화 API 연결 성공" });
});

// ✅ 추가된 POST 라우터
router.post("/", (req, res) => {
  // 필요한 초기화 로직이 있으면 여기에 작성
  res.json({ success: true, message: "✅ POST 초기화 처리 완료" });
});

module.exports = router;
