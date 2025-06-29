// processing.js
const express = require("express");
const router = express.Router();
const connectDB = require("./db");

router.post("/process", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");
    const { nickname, material, product } = req.body;
    const materialField = material;
    const productField = `product_${product}`;
    const productTimestampField = `product_${product}_timestamps`;

    const user = await users.findOne({ nickname });
    if (!user || !user[materialField] || user[materialField] < 1) {
      return res.status(400).json({ error: "재료 부족" });
    }

    await users.updateOne(
      { nickname },
      {
        $inc: { [materialField]: -1, [productField]: 1 },
        $push: { [productTimestampField]: new Date() },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/unseal", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");
    const { nickname, product, tokenCost } = req.body;
    const productField = `product_${product}_timestamps`;

    const user = await users.findOne({ nickname });
    if (!user || !user[productField]) {
      return res.status(400).json({ error: "유저 또는 제품 없음" });
    }

    const now = Date.now();
    const timestamps = user[productField] || [];
    const sealed = timestamps.filter(
      (t) => now - new Date(t).getTime() > 7 * 24 * 60 * 60 * 1000
    );

    if (sealed.length === 0) {
      return res.status(400).json({ error: "묶인 제품 없음" });
    }

    if (user.token < tokenCost) {
      return res.status(400).json({ error: "토큰 부족" });
    }

    const updatedTimestamps = timestamps.filter(
      (t) => now - new Date(t).getTime() <= 7 * 24 * 60 * 60 * 1000
    );

    await users.updateOne(
      { nickname },
      {
        $set: { [productField]: updatedTimestamps },
        $inc: { token: -tokenCost }
      }
    );

    res.json({ success: true, unlocked: sealed.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
