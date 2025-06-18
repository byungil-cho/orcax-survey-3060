// userdata.js - 최종 패치본
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET: nickname으로 사용자 데이터 조회
router.get('/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname.trim(); // 공백 제거
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({
      success: true,
      nickname: user.nickname,
      farmName: user.farmName,
      potatoCount: user.potatoCount,
      barleyCount: user.barleyCount,
      water: user.water,
      fertilizer: user.fertilizer,
      token: user.token,
      growth: user.growth
    });
  } catch (err) {
    console.error("조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// PATCH: 사용자 성장 포인트 반영 및 자산 갱신
router.patch('/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname.trim(); // 공백 제거
    const updateData = req.body;

    const user = await User.findOneAndUpdate(
      { nickname },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "업데이트 실패: 사용자 없음" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("업데이트 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
