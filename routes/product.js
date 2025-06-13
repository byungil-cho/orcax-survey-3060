const express = require('express');
const router = express.Router();
const Farm = require('../Farm');

// 제품 가공
router.post('/product/create', async (req, res) => {
    const { nickname, type } = req.body;
    if (!nickname || !type) return res.json({ success: false, message: "필수 데이터 누락" });

    try {
        const user = await Farm.findOne({ nickname });
        if (!user) return res.json({ success: false, message: "유저 없음" });

        if ((user.potatoCount || 0) <= 0) {
            return res.json({ success: false, message: "감자 부족" });
        }

        user.potatoCount -= 1;

        const existing = user.inventory.find(i => i.type === type);
        if (existing) {
            existing.count += 1;
        } else {
            user.inventory.push({ type, count: 1 });
        }

        await user.save();
        res.json({ success: true, inventory: user.inventory });
    } catch (err) {
        res.status(500).json({ success: false, message: "가공 실패" });
    }
});

// 제품 폐기
router.post('/product/delete', async (req, res) => {
    const { nickname, index } = req.body;
    if (!nickname || index === undefined) return res.json({ success: false, message: "필수 데이터 누락" });

    try {
        const user = await Farm.findOne({ nickname });
        if (!user) return res.json({ success: false, message: "유저 없음" });

        if (!user.inventory || !user.inventory[index]) {
            return res.json({ success: false, message: "유효하지 않은 인덱스" });
        }

        const item = user.inventory[index];
        if (item.count > 1) {
            item.count -= 1;
        } else {
            user.inventory.splice(index, 1);
        }

        await user.save();
        res.json({ success: true, inventory: user.inventory });
    } catch (err) {
        res.status(500).json({ success: false, message: "삭제 실패" });
    }
});

module.exports = router;
