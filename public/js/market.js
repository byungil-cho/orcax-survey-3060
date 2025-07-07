// login.js
const express = require('express');
const router = express.Router();

// 예시 라우트 (필요한 로그인 로직 추가)
router.post('/', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.status(200).json({ message: '로그인 성공' });
  } else {
    res.status(401).json({ message: '로그인 실패' });
  }
});

module.exports = router;

// public/js/market.js 로 따로 클라이언트 스크립트를 분리해야 함
// routes/market.js 는 서버 사이드 코드이므로 document 관련 코드가 있으면 안 됨
