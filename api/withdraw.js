// api/withdraw.js

const express = require("express");
const router = express.Router();
const connectDB = require("./db");

// 출금 신청 요청
router.post("/request", async (req, res) => {
  const { nickname, name, email, phone, phantom, solana, polygon } = req.body;
  const db = await connectDB();
  const users = db.collection("users");
  const withdraws = db.collection("withdraws");

  try {
    const user = await users.findOne({ nickname });
    if (!user || user.token < 50000) {
      return res.status(400).json({ error: "토큰 부족: 50000 이상 필요" });
    }

    await withdraws.insertOne({
      nickname,
      name,
      email,
      phone,
      phantom,
      solana,
      polygon,
      amount: user.token,
      status: "요청됨",
      requestedAt: new Date(),
    });

    res.json({ success: true, message: "출금 요청 완료" });
  } catch (err) {
    console.error("출금 요청 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
