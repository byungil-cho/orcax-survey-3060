const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// 사용자 정보 조회
router.get('/userdata', async (req, res) => {
    const { nickname } = req.query;
    if (!nickname) return res.json({ success: false, message: "닉네임 없음" });

    try {
        const user = await Farm.findOne({ nickname });
        if (!user) return res.json({ success: false, message: "유저 없음" });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "서버 오류" });
    }
});

// 감자 수확 (기본 수확 수 +1)
router.post('/harvest', async (req, res) => {
    const { nickname } = req.body;
    if (!nickname) return res.json({ success: false, message: "닉네임 없음" });

    try {
        const user = await Farm.findOne({ nickname });
        if (!user) return res.json({ success: false, message: "유저 없음" });

        user.potatoCount = (user.potatoCount || 0) + 1;
        await user.save();
        res.json({ success: true, potatoCount: user.potatoCount });
    } catch (err) {
        res.status(500).json({ success: false, message: "수확 실패" });
    }
});

// 사용자 정보 업데이트
router.post('/update-user', async (req, res) => {
    const { nickname, data } = req.body;
    if (!nickname || !data) return res.json({ success: false, message: "필수 데이터 누락" });

    try {
        const updated = await Farm.findOneAndUpdate({ nickname }, data, { new: true });
        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "업데이트 실패" });
    }
});

module.exports = router;
