router.get("/", async (req, res) => {
  const id = req.query.id; // 예시로 쿼리 파라미터로 ID 전달 가능
  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      nickname: user.nickname || "범고래X",
      token: user.token || 0,
      seed_potato: user.seedPotato || 0,
      seed_barley: user.seedBarley || 0
    });
  } catch (err) {
    console.error("user data fetch error:", err);
    res.status(500).json({ success: false });
  }
});
