router.get('/', async (req, res) => {
  const kakaoId = req.query.kakaoId;

  try {
    const user = await User.findOne({ kakaoId });

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: '유저를 찾을 수 없음' });
    }
  } catch (error) {
    console.error('userdata 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});
