// api/auth.js

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
      // 새 유저: 기본 자재 지급
      user = {
        nickname,
        token: 10, // 🐳 ORCX
        seedGamja: 2, // 🥔 씨감자
        seedBori: 2, // 🌾 씨보리
        water: 10, // 💧 물
        dung: 10, // 💩 거름
        farmLogs: [],
        level: 1,
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
