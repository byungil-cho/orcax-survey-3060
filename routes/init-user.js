// routes/init-user.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: '닉네임이 필요합니다.' });
  }
  res.json({ message: `${nickname} 초기화 완료`, success: true });
});

module.exports = router;
