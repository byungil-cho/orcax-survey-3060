const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.post('/process-product', async (req, res) => {
  try {
    const { nickname, type, name } = req.body;
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });

    if (type === 'potato') {
      if (user.potatoCount < 1) return res.json({ success: false, message: "감자가 부족합니다." });
      user.potatoCount -= 1;
      user.potatoProduct = (user.potatoProduct || 0) + 1;
    } else if (type === 'barley') {
      if (user.barleyCount < 1) return res.json({ success: false, message: "보리가 부족합니다." });
      user.barleyCount -= 1;
      user.barleyProduct = (user.barleyProduct || 0) + 1;
    } else {
      return res.status(400).json({ success: false, message: "잘못된 타입입니다." });
    }

    await user.save();
    res.json({ success: true, message: `${name} 가공 완료!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "서버 오류입니다." });
  }
});

module.exports = router;