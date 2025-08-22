// routes/initUserRoutes.js
const express = require("express");
const router = express.Router();

// 로그인 후 초기 유저 세팅
router.post("/", async (req, res) => {
  try {
    const { kakaoId, nickname } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

    const db = req.app.locals.db; // server-unified.js에서 db를 app.locals로 공유했다고 가정
    const users = db.collection("users");

    let user = await users.findOne({ kakaoId });
    if (!user) {
      user = { kakaoId, nickname, water: 10, fertilizer: 10, token: 10 };
      await users.insertOne(user);
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("init-user error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
