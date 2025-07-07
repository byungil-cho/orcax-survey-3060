router.post('/', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({ kakaoId, nickname });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('init-user 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});
