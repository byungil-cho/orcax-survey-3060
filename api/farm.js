// api/farm.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 감자/보리 농사짓기 - 성장포인트 1 올림
router.post("/grow", async (req, res) => {
  const { nickname, cropType } = req.body; // cropType: "gamja" or "bori"
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "사용자 없음" });

    if (user.water <= 0 || user.dung <= 0) {
      return res.status(400).json({ error: "물 또는 거름 부족" });
    }

    const field = cropType === "gamja" ? "gamjaGrow" : "boriGrow";
    const newGrow = (user[field] || 0) + 1;

    await users.updateOne(
      { nickname },
      {
        $set: { [field]: newGrow },
        $inc: { water: -1, dung: -1 }
      }
    );

    res.json({ success: true, newGrow });
  } catch (err) {
    console.error("성장 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 수확 처리 (5 이상 시 작동)
router.post("/harvest", async (req, res) => {
  const { nickname, cropType } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "사용자 없음" });

    const field = cropType === "gamja" ? "gamjaGrow" : "boriGrow";
    const seedField = cropType === "gamja" ? "seedGamja" : "seedBori";
    const resultField = cropType === "gamja" ? "gamja" : "bori";

    const grow = user[field] || 0;
    const seeds = user[seedField] || 0;

    if (grow < 5 || seeds < 1) {
      return res.status(400).json({ error: "성장포인트 부족 또는 씨앗 없음" });
    }

    const amount = [3, 5, 7][Math.floor(Math.random() * 3)];

    await users.updateOne(
      { nickname },
      {
        $inc: { [resultField]: amount, [seedField]: -1 },
        $set: { [field]: 0 }
      }
    );

    res.json({ success: true, harvested: amount });
  } catch (err) {
    console.error("수확 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
