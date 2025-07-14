const express = require("express");
const router = express.Router();
const User = require("../models/users");

router.post("/", async (req, res) => {
  const { kakaoId, nickname } = req.body;

  if (!kakaoId || !nickname) {
    return res.status(400).json({ message: "kakaoId와 nickname이 필요합니다." });
  }

  try {
    let user = await User.findOne({ kakaoId });

    if (user) {
      return res.status(200).json({ message: "이미 존재하는 사용자입니다.", user });
    }

    // 고유 인덱스 에러 방지를 위해 email이 없으면 자동 생성
    const email = `user-${kakaoId}@noemail.local`;

    const newUser = new User({
      kakaoId,
      nickname,
      email,
      orcx: 10,
      water: 10,
      fertilizer: 10,
      potato: 0,
      bori: 0,
      seedPotato: 0,
      seedBarley: 0,
    });

    await newUser.save();
    res.status(201).json({ message: "신규 사용자 생성 완료", user: newUser });
  } catch (err) {
    console.error("❌ init-user 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
});

module.exports = router;
