// factory.js (2025-07-19 통합 최신본)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SeedStock = require('../models/SeedStock');

// [공통 유틸]
function getResourceNames(type) {
    if (type === 'potato') return { seed: 'seedPotato', crop: 'potato', storage: 'gamja' };
    if (type === 'barley') return { seed: 'seedBarley', crop: 'barley', storage: 'bori' };
    throw new Error('Invalid type');
}

// [성장포인트 계산]
function calcGrowth(usedWater, usedFertilizer) {
    return (usedWater * 1) + (usedFertilizer * 2);
}

// [물주기/거름주기/성장]
router.patch('/use-resource', async (req, res) => {
    try {
        const { id, type, useWater, useFertilizer } = req.body;
        const resource = getResourceNames(type);

        // 유저 찾기
        const user = await User.findOne({ kakaoId: id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 자원 체크
        if (user[resource.seed] < 1 || user.water < useWater || user.fertilizer < useFertilizer)
            return res.status(400).json({ message: 'Not enough resources' });

        // 자원 차감
        user[resource.seed] -= 1;
        user.water -= useWater;
        user.fertilizer -= useFertilizer;

        // 성장포인트 증가
        user.growth[type] = (user.growth[type] || 0) + calcGrowth(useWater, useFertilizer);

        await user.save();

        // 관리자 보관소(씨앗 반환)
        await SeedStock.updateOne({ type: resource.seed }, { $inc: { quantity: 1 } });

        res.json({
            success: true,
            user: {
                water: user.water,
                fertilizer: user.fertilizer,
                seed: user[resource.seed],
                growth: user.growth[type]
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [수확하기]
router.post('/harvest', async (req, res) => {
    try {
        const { id, type } = req.body;
        const resource = getResourceNames(type);

        const user = await User.findOne({ kakaoId: id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 수확 조건(예: 성장포인트 5 이상)
        if ((user.growth[type] || 0) < 5)
            return res.status(400).json({ message: 'Not enough growth to harvest' });

        // 랜덤 수확 (3, 5, 7)
        const harvestAmount = [3, 5, 7][Math.floor(Math.random() * 3)];
        user.storage[resource.storage] = (user.storage[resource.storage] || 0) + harvestAmount;
        user.growth[type] -= 5; // 성장포인트 차감(수확마다 -5)

        await user.save();

        res.json({
            success: true,
            crop: user.storage[resource.storage],
            growth: user.growth[type],
            amount: harvestAmount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [보유 자원 조회]
router.post('/v2data', async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findOne({ kakaoId: id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            water: user.water,
            fertilizer: user.fertilizer,
            seedPotato: user.seedPotato,
            seedBarley: user.seedBarley,
            orcx: user.orcx,
            growthPotato: user.growth.potato || 0,
            growthBarley: user.growth.barley || 0,
            storage: user.storage
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
