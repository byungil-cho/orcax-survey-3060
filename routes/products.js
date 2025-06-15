const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // ✅ mongoose 모델

// ✅ 제품 저장 API (기존 제품 삭제 후 새로 등록)
router.post('/:nickname', async (req, res) => {
  const nickname = req.params.nickname;
  const inventory = req.body; // [{ name, type, count }, ...]

  if (!Array.isArray(inventory)) {
    return res.status(400).json({ success: false, message: "잘못된 데이터 형식입니다." });
  }

  try {
    // 기존 해당 유저 제품 전체 삭제
    await Product.deleteMany({ nickname });

    // 새로운 목록 저장 (nickname 포함하여 삽입)
    const saved = await Product.insertMany(
      inventory.map(item => ({
        nickname,
        name: item.name,
        type: item.type,
        count: item.count
      }))
    );

    res.json({ success: true, saved });
  } catch (err) {
    console.error("제품 저장 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류", error: err.message });
  }
});

module.exports = router;
