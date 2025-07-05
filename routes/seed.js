// routes/seed.js
const express = require('express');
const router = express.Router();

const SeedInventory = require('../models/SeedInventory');
const User = require('../models/User');
const UserInventory = require('../models/UserInventory');

router.post('/purchase', async (req, res) => {
  const { kakaoId, type } = req.body;
  const seedType = type === 'seedPotato' ? 'seedPotato' : 'seedBarley';

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ message: '유저 없음' });

    const seedEntry = await SeedInventory.findOne({ type: seedType });
    if (!seedEntry || seedEntry.quantity <= 0) {
      return res.status(400).json({ message: '씨앗 품절' });
    }

    if (user.orcx < seedEntry.price) {
      return res.status(400).json({ message: '토큰 부족' });
    }

    let inventory = await UserInventory.findOne({ kakaoId });
    if (!inventory) {
      inventory = new UserInventory({ kakaoId });
    }

    const totalSeeds = inventory.seedPotato + inventory.seedBarley;
    if (totalSeeds >= 4) {
      return res.status(400).json({ message: '씨앗 보유 한도 초과' });
    }

    // 구매 처리
    seedEntry.quantity -= 1;
    user.orcx -= seedEntry.price;
    inventory[seedType] += 1;

    await Promise.all([seedEntry.save(), user.save(), inventory.save()]);

    res.json({
      message: '씨앗 구매 완료',
      remainingToken: user.orcx,
      inventory: {
        seedPotato: inventory.seedPotato,
        seedBarley: inventory.seedBarley
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.post('/use', async (req, res) => {
  const { kakaoId, type, quantity } = req.body;
  const seedType = type === 'seedPotato' ? 'seedPotato' : 'seedBarley';

  try {
    const inventory = await UserInventory.findOne({ kakaoId });
    if (!inventory || inventory[seedType] < quantity) {
      return res.status(400).json({ message: '보유 씨앗 부족' });
    }

    const seedEntry = await SeedInventory.findOne({ type: seedType });
    if (!seedEntry) return res.status(404).json({ message: '씨앗 항목 없음' });

    // 사용 처리
    inventory[seedType] -= quantity;
    seedEntry.quantity += quantity;

    // 농작물 생산 (랜덤 3, 5, 7)
    const yieldOptions = [3, 5, 7];
    const randomYield = yieldOptions[Math.floor(Math.random() * yieldOptions.length)];
    inventory[`${seedType}Crop`] = (inventory[`${seedType}Crop`] || 0) + randomYield * quantity;

    // 가공식품 생산용 감자/보리 작물도 업데이트 필요시 별도 라우터에서 처리 가능

    await Promise.all([inventory.save(), seedEntry.save()]);

    res.json({
      message: `${seedType} ${quantity}개 사용 완료`,
      cropYield: randomYield * quantity,
      inventory: {
        seedPotato: inventory.seedPotato,
        seedBarley: inventory.seedBarley,
        seedPotatoCrop: inventory.seedPotatoCrop || 0,
        seedBarleyCrop: inventory.seedBarleyCrop || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.post('/returnAll', async (req, res) => {
  const { kakaoId } = req.body;

  try {
    const inventory = await UserInventory.findOne({ kakaoId });
    if (!inventory) return res.status(404).json({ message: '유저 인벤토리 없음' });

    const potatoEntry = await SeedInventory.findOne({ type: 'seedPotato' });
    const barleyEntry = await SeedInventory.findOne({ type: 'seedBarley' });
    if (!potatoEntry || !barleyEntry) {
      return res.status(404).json({ message: '씨앗 항목 없음' });
    }

    const returnedPotato = inventory.seedPotato;
    const returnedBarley = inventory.seedBarley;

    potatoEntry.quantity += returnedPotato;
    barleyEntry.quantity += returnedBarley;

    inventory.seedPotato = 0;
    inventory.seedBarley = 0;

    await Promise.all([
      potatoEntry.save(),
      barleyEntry.save(),
      inventory.save()
    ]);

    res.json({
      message: '모든 씨앗 반환 완료',
      returned: {
        seedPotato: returnedPotato,
        seedBarley: returnedBarley
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
