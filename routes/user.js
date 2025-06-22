const express = require("express");
const User = require("../models/User"); // 유저 모델
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "유저 없음" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 에러" });
  }
});

router.get("/inventory", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });
    res.json({ success: true, inventory: user.inventory || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "자재 조회 실패" });
  }
});

module.exports = router;
