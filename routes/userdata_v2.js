const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  try {
    const kakaoId = req.body.kakaoId;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: "kakaoId is missing" });
    }

    const user = await User.findOne({ 카카오아이디: kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        nickname: user["별명"],
        orcx_token: user["오크"],
        water: user["물"],
        fertilizer: user["비료"],
        inventory: {
          seed_potato: user["씨앗감자"],
          seed_barley: user["씨앗보리"]
        }
      }
    });
  } catch (err) {
    console.error("❌ /api/userdata_v2 error", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
