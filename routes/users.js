// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({
    nickname: '범고래X'
  });
});

module.exports = router;