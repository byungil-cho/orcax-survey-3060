// -------------- userdata.js --------------
// 📂 routes/userdata.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ MongoDB 스키마 정의 (컬렉션 명시!)
const userSchema = new mongoose.Schema({
  nickname: String,
  water: { type: Number, default: 10 },
  fertilizer: { type: Number, default: 10 },
  orcx: { type: Number, default: 10 },
  token: { type: Number, default: 0 },
  potatoCount: { type: Number, default: 0 },
  seed_barley: { type: Number, default: 0 },
  farmingCount: { type: Number, default: 0 },
  harvestCount: { type: Number, default: 0 },
  inventory: { type: Array, default: [] },
  exchangeLogs: { type: Array, default: [] },
  lastRecharge: { type: String, default: Date.now },
});

const User = mongoose.model("User", userSchema, "users");

// ✅ [1] 쿼리 방식 지원 → /api/userdata?nickname=범고래X
router.get("/", async (req, res) => {
  const { nickname } = req.query;

  if (!nickname) {
    return res.status(400).json({ success: false, message: "닉네임이 없습니다" });
  }

  try {
    const user = await User.findOne({ nickname });
    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, users: [user] });
  } catch (error) {
    res.status(500).json({ success: false, message: "서버 에러", error });
  }
});

// ✅ [2] REST 방식 → /api/userdata/userdata/범고래X
router.get("/userdata/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, users: [user] });
  } catch (error) {
    res.status(500).json({ success: false, message: "서버 에러", error });
  }
});

// ✅ [3] 새로운 경로 지원 → /api/user/범고래X 와도 연결되도록
router.get("/:nickname", async (req, res) => {
  try {
    const nickname = decodeURIComponent(req.params.nickname);
    const user = await User.findOne({ nickname });

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    res.json({ success: true, users: [user] });
  } catch (error) {
    res.status(500).json({ success: false, message: "서버 에러", error });
  }
});

module.exports = router;
