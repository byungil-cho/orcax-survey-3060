const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/api/userdata", async (req, res) => {
  const { kakaoId } = req.query;
  const user = await User.findOne({ kakaoId });
  res.json(user);
});

module.exports = router;
