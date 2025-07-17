// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.post('/v2data', async (req, res) => {
  // 처리 로직
});

router.post('/userdata', async (req, res) => {
  // 처리 로직
});

module.exports = router;
