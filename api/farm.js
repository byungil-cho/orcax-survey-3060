router.post("/grow", async (req, res) => {
  try {
    const { nickname, cropType } = req.body;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (cropType === "water") {
      if (user.water < 1) {
        return res.status(400).json({ success: false, error: "물 부족" });
      }
      user.water -= 1;
    } else if (cropType === "fertilizer") {
      if (user.fertilizer < 1) {
        return res.status(400).json({ success: false, error: "거름 부족" });
      }
      user.fertilizer -= 1;
    } else {
      return res.status(400).json({ success: false, error: "Invalid cropType" });
    }

    user.growthPoint = (user.growthPoint || 0) + 1;
    await user.save();

    res.json({ success: true, growthPoint: user.growthPoint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
