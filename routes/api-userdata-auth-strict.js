
// Express.js 서버 예시 코드 - 사용자 인증 포함한 /api/userdata
const express = require("express");
const router = express.Router();
const Farm = require("../models/Farm"); // Farm 모델

// 유저 정보 불러오기 API (강력 인증 포함)
router.post("/userdata", async (req, res) => {
  try {
    const { nickname } = req.body;

    // 닉네임 없을 경우 바로 차단
    if (!nickname) {
      return res.status(401).json({
        success: false,
        message: "🚫 인증되지 않은 접근입니다. 로그인 후 이용해 주세요."
      });
    }

    const user = await Farm.findOne({ nickname });

    // 유저 없음
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "❌ 등록되지 않은 사용자입니다."
      });
    }

    // 정상 응답
    return res.json({
      success: true,
      user: {
        nickname: user.nickname,
        farmName: user.farmName || "미지정",
        water: user.water,
        fertilizer: user.fertilizer,
        token: user.token
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "🔥 서버 오류 발생",
      error: err.message
    });
  }
});

module.exports = router;
