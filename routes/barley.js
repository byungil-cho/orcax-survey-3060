router.post('/harvest-barley', async (req, res) => {
  const { nickname, amount } = req.body;
  if (!nickname || !amount) {
    return res.json({ success: false, message: "필수값 누락" });
  }

  try {
    let user = await Farm.findOne({ nickname });
    if (!user) {
      user = await Farm.create({ nickname, barley: 0 });
    }

    user.barley += Number(amount);
    await user.save();

    res.json({ success: true, amount });
  } catch (err) {
    console.error("❌ 수확 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
