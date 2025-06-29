// admin.js
const express = require("express");
const router = express.Router();
const connectDB = require("./db");

router.post("/seed-price", async (req, res) => {
  try {
    const db = await connectDB();
    const config = db.collection("config");
    const { seed, price } = req.body;
    await config.updateOne(
      { name: seed },
      { $set: { price } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/product-price", async (req, res) => {
  try {
    const db = await connectDB();
    const billboard = db.collection("billboard");
    const { product, price } = req.body;
    await billboard.updateOne(
      { product },
      { $set: { price } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/withdraw/approve", async (req, res) => {
  try {
    const db = await connectDB();
    const withdraws = db.collection("withdraws");
    const { nickname, status } = req.body;
    await withdraws.updateOne({ nickname }, { $set: { status } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/bonus", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");
    const { nickname, token, gamjaSeed, boriSeed } = req.body;
    await users.updateOne(
      { nickname },
      { $inc: { token, gamjaSeed, boriSeed } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ✅ 관리자 토큰 수동 조정 API 추가
router.post("/adjust-token", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");
    const { nickname, amount } = req.body;
    await users.updateOne(
      { nickname },
      { $inc: { token: amount } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
