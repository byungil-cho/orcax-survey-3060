const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = mongoose.model("users", new mongoose.Schema({}, { strict: false }));

// ✅ GET 방식도 대응하도록 추가
router.get("/", async (req, res) => {
  try {
    const { id } = req.query; // 예: /api/user/data?id=1234
    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      nickname: user.nickname || "범고래X",
      token: user.token || 0,
      seed_potato: user.seedPotato || 0,
      seed_barley: user.seedBarley || 0
    });
  } catch (err) {
    console.error("❌ user data fetch error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
