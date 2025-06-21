// api/farm.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 감자/보리 성장 처리
router.post("/grow", async (req, res) => {
  const { nickname, cropType } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "사용자 없음" });

    const field = cropType === "gamja" ? "gamjaGrow" : "boriGrow";
    const seedField = cropType === "gamja" ? "seedGamja" : "seedBori";

    // 자원 부족 체크
    if ((user.water || 0) < 1 || (user.dung || 0) < 1 || (user[seedField] || 0) < 1) {
      return res.status(400).json({ error: "물/거름/씨앗 부족" });
    }

    const newGrow = (user[field] || 0) + 1;

    await users.updateOne(
      { nickname },
      {
        $set: { [field]: newGrow },
        $inc: {
          water: -1,
          dung: -1,
          [seedField]: -1
        }
      }
    );

    res.json({ success: true, newGrow });
  } catch (err) {
    console.error("성장 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 수확 처리
router.post("/harvest", async (req, res) => {
  const { nickname, cropType } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "사용자 없음" });

    const field = cropType === "gamja" ? "gamjaGrow" : "boriGrow";
    const resultField = cropType === "gamja" ? "gamja" : "bori";
    const grow = user[field] || 0;

    if (grow < 5) {
      return res.status(400).json({ error: "성장포인트 부족" });
    }

    const amount = [3, 5, 7][Math.floor(Math.random() * 3)];

    await users.updateOne(
      { nickname },
      {
        $inc: { [resultField]: amount },
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
