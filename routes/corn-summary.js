const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 기존 User 모델 경로는 프로젝트 구조에 맞춰 조정
let Users;
try { Users = require('../models/User'); } catch (_) { Users = null; }

router.get('/health', async (req, res) => {
  try {
    const ok = mongoose.connection.readyState === 1;
    return res.json({ status: ok ? 'OK' : 'DOWN', db: ok });
  } catch (e) {
    return res.status(500).json({ status: 'DOWN', error: e.message });
  }
});

// 통합 요약: 물/거름(users) + 씨앗(corn_data) 한방에
router.get('/summary/:kakaoId', async (req, res) => {
  const kakaoId = req.params.kakaoId;
  try {
    // users 컬렉션
    let water = 0, fertilizer = 0;
    if (Users) {
      const user = await Users.findOne(
        { kakaoId },
        { 'inventory.water': 1, 'inventory.fertilizer': 1 }
      ).lean();
      water = Number(user?.inventory?.water ?? 0);
      fertilizer = Number(user?.inventory?.fertilizer ?? 0);
    } else {
      // 모델이 없다면 네이티브로
      const u = await mongoose.connection.collection('users')
        .findOne({ kakaoId }, { projection: { 'inventory.water': 1, 'inventory.fertilizer': 1 } });
      water = Number(u?.inventory?.water ?? 0);
      fertilizer = Number(u?.inventory?.fertilizer ?? 0);
    }

    // corn_data 컬렉션(모델 없이 네이티브로 안전 접근)
    const cd = await mongoose.connection.collection('corn_data')
      .findOne({ kakaoId }, { projection: { data: 1, seeds: 1, seed: 1 } });

    // seeds/seed 어디에 있든 안전 파싱
    const seeds =
      Number(cd?.data?.agri?.seeds ?? cd?.data?.agri?.seed ?? cd?.seeds ?? cd?.seed ?? 0);

    return res.json({ ok: true, water, fertilizer, seeds });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
