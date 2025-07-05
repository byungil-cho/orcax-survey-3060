const express = require("express");
const router = express.Router();
const { getUserByKakaoId, createUser } = require("../api/login");

router.post("/", async (req, res) => {
  try {
    const { kakaoId } = req.body;
    if (!kakaoId) return res.status(400).json({ success: false, message: "카카오 ID 없음" });

    let user = await getUserByKakaoId(kakaoId);
    if (!user) {
      user = await createUser(kakaoId); // 물10, 비료10, 토큰10 주는 함수
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("로그인 에러:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
