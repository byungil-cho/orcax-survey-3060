// routes/auth.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 로그인 후 초기 자재 지급 및 사용자 정보 등록
router.post("/login", async (req, res) => {
  const { nickname } = req.body;
  const db = await connectDB();
  const users = db.collection("users");

  try {
    let user = await users.findOne({ nickname });

    if (!user) {
      user = {
        nickname,
        token: 10,
        seed_potato: 2,
        seed_barley: 2,
        water: 10,
        fertilizer: 10,
        level: 1,
        farmLogs: [],
        createdAt: new Date(),
      };
      await users.insertOne(user);
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("로그인 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
