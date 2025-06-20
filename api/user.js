// api/user.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 사용자 자재 조회
router.get("/inventory/:nickname", async (req, res) => {
  const { nickname } = req.params;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname }, { projection: { _id: 0 } });
    if (!user) return res.status(404).json({ error: "사용자 없음" });
    res.json(user);
  } catch (err) {
    console.error("자재 조회 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 농사 횟수 업데이트 및 레벨 상승 처리
router.post("/updateFarmLog", async (req, res) => {
  const { nickname } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    const user = await users.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "사용자 없음" });

    const newFarmLogs = [...user.farmLogs, new Date()];
    const farmCount = newFarmLogs.length;

    let level = 1;
    if (farmCount >= 200) level = 10;
    else if (farmCount >= 150) level = 9;
    else if (farmCount >= 90) level = 8;
    else if (farmCount >= 60) level = 7;
    else if (farmCount >= 40) level = 6;
    else if (farmCount >= 30) level = 5;
    else if (farmCount >= 20) level = 4;
    else if (farmCount >= 10) level = 3;
    else if (farmCount >= 2) level = 2;

    await users.updateOne({ nickname }, {
      $set: { level, farmLogs: newFarmLogs }
    });

    res.json({ success: true, level });
  } catch (err) {
    console.error("농사 로그 업데이트 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
