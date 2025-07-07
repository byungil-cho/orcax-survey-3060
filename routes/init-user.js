// routes/init-user.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  // 사용자 초기화 로직 샘플
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: '닉네임이 필요합니다.' });
  }

  // 실제로는 DB에 사용자 초기값을 저장하는 로직이 와야 함
  res.json({ message: `${nickname} 초기화 완료`, success: true });
});

module.exports = router;