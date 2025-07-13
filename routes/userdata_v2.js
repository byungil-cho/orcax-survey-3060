const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = mongoose.model("users", new mongoose.Schema({}, { strict: false }));

router.post("/", async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        nickname: user.nickname || "No Nickname",
        token: user.token || 0,
        inventory: {
          seedPotato: user.inventory?.seedPotato || 0,
          seedBarley: user.inventory?.seedBarley || 0,
        }
      }
    });
  } catch (err) {
    console.error("❌ userdata_v2.js error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
