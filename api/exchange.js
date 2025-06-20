// api/exchange.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 제품 → 자재 교환 (제품 1개 → 물 5병, 거름 3봉지)
router.post("/exchange", async (req, res) => {
  const { nickname, product } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  const productField = `product_${product}`;

  try {
    const user = await users.findOne({ nickname });
    if (!user || !user[productField] || user[productField] < 1) {
      return res.status(400).json({ error: "제품 부족" });
    }

    await users.updateOne(
      { nickname },
      {
        $inc: {
          water: 5,
          dung: 3,
          [productField]: -1
        }
      }
    );

    res.json({ success: true, received: { water: 5, dung: 3 } });
  } catch (err) {
    console.error("교환 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
