const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SeedPrice = mongoose.model("seedprices", new mongoose.Schema({}, { strict: false }));

// 가격 조회 (그대로 유지)
router.get("/", async (req, res) => {
  try {
    const latest = await SeedPrice.findOne({}).sort({ _id: -1 });
    if (!latest) {
      return res.json({ success: false, message: "가격 정보 없음" });
    }
    res.json({
      success: true,
      seedPotatoPrice: latest.potato || 0,
      seedBarleyPrice: latest.barley || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 🟢 가격 변경(등록) 라우터 추가!
router.post("/", async (req, res) => {
  const { potato, barley } = req.body;
  try {
    const newPrice = new SeedPrice({ potato, barley });
    await newPrice.save();
    res.json({ success: true, potato: newPrice.potato, barley: newPrice.barley });
  } catch (err) {
    res.status(500).json({ success: false, message: "가격 변경 실패" });
  }
});

module.exports = router;
