app.post("/api/fertilize-barley", async (req, res) => {
  const { nickname } = req.body;
  const user = await Farm.findOne({ nickname });
  if (!user) return res.status(404).json({ error: "User not found" });

  if ((user.fertilizer || 0) <= 0) {
    return res.status(400).json({ error: "거름 부족" });
  }

  user.fertilizer -= 1;
  user.fertilizerGiven = (user.fertilizerGiven || 0) + 1;
  await user.save();
  res.status(200).json({ success: true });
});
