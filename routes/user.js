// [POST] /api/init-user
router.post("/init-user", async (req, res) => {
  const { nickname } = req.body;
  try {
    const existing = await User.findOne({ nickname });
    if (existing) {
      return res.json({ message: "이미 존재하는 유저" });
    }

    // ✅ 여기 위치에 newUser 생성자 코드를 넣으시면 됩니다!
    const newUser = new User({
      nickname,
      orcx: 10,
      water: 10,
      fertilizer: 10,
      seedPotato: 0,
      seedBarley: 0,       // ✅ 추가
      potatoCount: 0,
      barleyCount: 0,      // ✅ 추가
      harvestCount: 0,
      inventory: [],
    });

    await newUser.save();
    return res.json({ success: true, message: "신규 유저 등록 완료" });
  } catch (err) {
    console.error("init-user 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});
