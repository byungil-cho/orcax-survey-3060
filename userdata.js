const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, default: "신규 사용자" },
  farmName: { type: String, default: "" },
  token: { type: Number, default: 0 }, // DB 내 필드명은 token
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// ✅ 사용자 정보 조회 API
router.get("/", async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) return res.status(400).json({ error: "kakaoId 누락" });

  try {
    let user = await User.findOne({ kakaoId });

    // 유저가 없으면 새로 생성
    if (!user) {
      user = new User({ kakaoId });
      await user.save();
    }

    // ✅ 프론트에서 요구하는 필드명 orcx 로 변환해서 전달
    res.json({
      nickname: user.nickname,
      farmName: user.farmName,
      seedPotato: user.seedPotato || 0,
      seedBarley: user.seedBarley || 0,
      orcx: user.token || 0 // ✅ 핵심: orcx 이름으로 내려줌
    });
  } catch (err) {
    console.error("❌ 사용자 정보 조회 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
