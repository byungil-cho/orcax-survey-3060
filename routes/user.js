const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/init', async (req, res) => {
    const { kakaoId, nickname } = req.body;
    try {
        let user = await User.findOne({ kakaoId });
        if (!user) {
            user = new User({ kakaoId, nickname });
            await user.save();
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:kakaoId', async (req, res) => {
    try {
        const user = await User.findOne({ kakaoId: req.params.kakaoId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;