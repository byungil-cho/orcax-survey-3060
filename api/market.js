// api/market.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 제품 판매
router.post("/sell", async (req, res) => {
  const { nickname, product } = req.body;
  const db = await connectDB();
  const users = db.collection("users");
  const board = db.collection("billboard");

  try {
    const priceInfo = await board.findOne({ product });
    if (!priceInfo) return res.status(400).json({ error: "전광판에 없는 제품" });

    const productField = `product_${product}`;

    const user = await users.findOne({ nickname });
    if (!user || !user[productField] || user[productField] <= 0) {
      return res.status(400).json({ error: "제품 없음" });
    }

    await users.updateOne(
      { nickname },
      {
        $inc: {
          token: priceInfo.price,
          [productField]: -1
        }
      }
    );

    res.json({ success: true, earned: priceInfo.price });
  } catch (err) {
    console.error("판매 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
