// login.js
const express = require('express');
const router = express.Router();

// 예시 라우트 (필요한 로그인 로직 추가)
router.post('/', (req, res) => {
  // 로그인 로직 처리 (예시)
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.status(200).json({ message: '로그인 성공' });
  } else {
    res.status(401).json({ message: '로그인 실패' });
  }
});

module.exports = router;
