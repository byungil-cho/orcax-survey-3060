const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

router.get('/userdata/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname;
    const user = await Farm.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저 없음' });
    }

    res.json({
      success: true,
      user: {
        ...user._doc,
        potatoProduct: user.potatoProduct || 0,
        barleyProduct: user.barleyProduct || 0
      }
    });
  } catch (err) {
    console.error('서버 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;