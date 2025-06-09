const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.post('/login', async (req, res) => {
    const { nickname } = req.body;
    let user = await Farm.findOne({ nickname });
    if (!user) {
        user = await Farm.create({
            nickname,
            water: 10,
            fertilizer: 10,
            token: 5,
            potatoCount: 0,
            inventory: [],
            lastFreeTime: new Date(),
            freeFarmCount: 2,
            seedPotato: 0
        });
    }
    res.json({ success: true, nickname });
});

module.exports = router;
