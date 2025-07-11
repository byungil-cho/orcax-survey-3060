const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/userdata
router.post('/', async (req, res) => {
  try {
    const { kakaoId } = req.body;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId is required' });
    }

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in /api/userdata:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
