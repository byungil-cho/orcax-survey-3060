const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.post('/login', async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ success: false, message: '닉네임 누락' });
  }

  try {
    const existing = await Farm.findOne({ nickname });
    if (existing) {
      return res.json({ success: true, message: '이미 등록된 유저', user: existing });
    }

    const newUser = new Farm({ nickname }); // 기본값으로 자동 채워짐
    await newUser.save();
    res.json({ success: true, message: '신규 등록 완료', user: newUser });
  } catch (err) {
    console.error("등록 오류:", err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;