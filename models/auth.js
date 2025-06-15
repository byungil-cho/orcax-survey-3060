const { token } = req.body;

async function getKakaoUserData(token) {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
}

app.post("/api/userdata", async (req, res) => {
  try {
    const kakaoUserData = await getKakaoUserData(token);
    const nickname = kakaoUserData.kakao_account.profile.nickname;
    // 기존 DB 처리 로직 이어서...
    res.json({ nickname });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch nickname from Kakao" });
  }
});