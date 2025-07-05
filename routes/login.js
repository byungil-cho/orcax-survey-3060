const express = require("express");
const router = express.Router();
const { getUserByKakaoId, createUser } = require("../api/user");

router.post("/", async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId) {
    return res.status(400).json({ success: false, message: "kakaoId 없음" });
  }

  try {
    let user = await getUserByKakaoId(kakaoId);
    if (!user) {
      // 기본 자원 지급
      const newUser = {
        kakaoId,
        orcx: 10,
        water: 10,
        fertilizer: 10,
        nickname: "신규농부" + Math.floor(Math.random() * 10000)
      };
      await createUser(newUser);
      return res.json({ success: true, user: newUser });
    } else {
      return res.json({ success: true, user });
    }
  } catch (err) {
    console.error("login 에러:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
