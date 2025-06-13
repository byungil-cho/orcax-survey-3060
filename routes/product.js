const express = require("express");
const router = express.Router();
const ProductLog = require("../ProductLog");

// ✅ 제품 로그 저장 API
router.post("/save-product-log", async (req, res) => {
  const { nickname, productName, quantity } = req.body;

  if (!nickname || !productName || !quantity) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    const newLog = new ProductLog({ nickname, productName, quantity });
    await newLog.save();
    res.json({ success: true, message: "제품 로그 저장 완료" });
  } catch (err) {
    console.error("로그 저장 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 사용자별 저장된 제품 로그 조회
router.get("/product-log/:nickname", async (req, res) => {
  const { nickname } = req.params;

  try {
    const logs = await ProductLog.find({ nickname }).sort({ timestamp: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    console.error("로그 조회 실패:", err);
    res.status(500).json({ success: false, message: "조회 실패" });
  }
});

module.exports = router;
