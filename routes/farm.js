const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.get('/userdata/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname;
    const user = await Farm.findOne({ nickname: nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;