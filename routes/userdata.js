// routes/userdata.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User"); // 모델 위치 맞춰

// GET /api/userdata/:nickname
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ success: false, message: "서버 에러" });
  }
});

module.exports = router;
