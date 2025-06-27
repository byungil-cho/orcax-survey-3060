// [POST] /api/init-user
router.post("/init-user", async (req, res) => {
  const { nickname } = req.body;
  try {
    const existing = await User.findOne({ nickname });
    if (existing) {
      return res.json({ message: "이미 존재하는 유저" });
    }

    const newUser = new User({
      nickname,
      orcx: 10,              // ✅ ORCX 지급
      water: 10,             // ✅ 물 지급
      fertilizer: 10,        // ✅ 거름 지급
      seedPotato: 0,         // ❌ 씨감자 없음
      seedBarley: 0,         // ❌ 씨보리 없음
      inventory: [],
      potatoCount: 0,
      harvestCount: 0,
    });

    await newUser.save();
    return res.json({ success: true, message: "신규 유저 등록 완료" });
  } catch (err) {
    console.error("init-user 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});
