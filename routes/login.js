const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  const { nickname, userId } = req.body;

  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({
      userId,
      nickname,
      potatoCount: 0,
      water: 10,
      fertilizer: 10,
      token: 10,
      inventory: [
        { name: "씨감자", count: 2 },
        { name: "씨보리", count: 2 }
      ]
    });
    await user.save();
  }

  const accessToken = jwt.sign({ userId }, "SECRET_KEY", { expiresIn: "1h" });
  res.json({ success: true, accessToken });
});

module.exports = router;
