app.post("/api/login", async (req, res) => {
  const { nickname, userId } = req.body;
  
  // 1. 기존 유저 있는지 확인
  let user = await User.findOne({ userId });

  // 2. 없으면 새로 등록
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

  // 3. JWT 발급
  const accessToken = jwt.sign({ userId }, "SECRET_KEY", { expiresIn: "1h" });

  res.json({ success: true, accessToken });
});
