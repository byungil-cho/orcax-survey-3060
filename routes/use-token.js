app.post('/api/use-token', (req, res) => {
  const { nickname, amount, item } = req.body;

  if (!nickname || !amount || !item) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  if (!localData[nickname]) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (localData[nickname].orcx < amount) {
    return res.status(400).json({ success: false, message: "Insufficient tokens" });
  }

  localData[nickname].orcx -= amount;

  const gainedSeeds = Math.floor(amount / 2);
  if (item === "씨감자") {
    localData[nickname].seedPotato = (localData[nickname].seedPotato || 0) + gainedSeeds;
  } else if (item === "씨보리") {
    localData[nickname].seedBarley = (localData[nickname].seedBarley || 0) + gainedSeeds;
  } else {
    return res.status(400).json({ success: false, message: "Invalid item type" });
  }

  res.json({ success: true });
});
