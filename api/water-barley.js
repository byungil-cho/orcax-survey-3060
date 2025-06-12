app.post("/api/water-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ error: "User not found" });

  if ((user.water || 0) <= 0) {
    return res.status(400).json({ error: "물 부족" });
  }

  user.water -= 1;
  user.waterGiven = (user.waterGiven || 0) + 1;
  await user.save();
  res.status(200).json({ success: true });
});
